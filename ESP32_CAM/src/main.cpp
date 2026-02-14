#include <Arduino.h>
#include <esp_camera.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==============================================================================
// CARESYNVISION - ESP32-CAM MB BOARD MODULE
// Role: Patient Health Monitoring - Visual Data Capture
// Purpose: Capture patient vital signs, movement, and behavioral data
// ==============================================================================

// WiFi Configuration
const char* WIFI_SSID = "your-SSID";
const char* WIFI_PASSWORD = "your-PASSWORD";
const char* SERVER_URL = "http://your-server-ip:5000";

// Timing Configuration
const unsigned long CAPTURE_INTERVAL = 30000;  // Capture every 30 seconds for health monitoring
const unsigned long REQUEST_TIMEOUT = 30000;   // 30 seconds
unsigned long lastCaptureTime = 0;

// State Management
enum CameraState {
  STATE_IDLE,
  STATE_AUTHENTICATED,      // Device authenticated via fingerprint
  STATE_CAPTURING,
  STATE_PROCESSING,
  STATE_SENDING,
  STATE_ERROR,
  STATE_UNAUTHENTICATED     // Waiting for fingerprint authentication
};

CameraState currentState = STATE_UNAUTHENTICATED;

// ESP32-CAM MB Board Pin Configuration
#define Y2_GPIO_NUM 17
#define Y3_GPIO_NUM 35
#define Y4_GPIO_NUM 34
#define Y5_GPIO_NUM 5
#define Y6_GPIO_NUM 39
#define Y7_GPIO_NUM 18
#define Y8_GPIO_NUM 36
#define Y9_GPIO_NUM 19
#define XCLK_GPIO_NUM 0
#define PCLK_GPIO_NUM 22
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define SIOD_GPIO_NUM 21
#define SIOC_GPIO_NUM 26
#define PWDN_GPIO_NUM -1
#define RESET_GPIO_NUM -1

// LED Indicators
#define LED_STATUS_PIN 4      // Green: Operating
#define LED_AUTH_PIN 33       // Blue: Authentication status

// Patient Monitoring Session
struct PatientSession {
  String patientID;
  String sessionID;
  bool authenticated;
  unsigned long sessionStartTime;
  unsigned long lastCaptureTime;
};

PatientSession currentSession;

// Function Prototypes
void initializeCamera();
void initializeWiFi();
void capturePatientData();
bool sendPatientDataToServer(camera_fb_t *fb);
void handleCommand(String command);
void updateLEDStatus(CameraState state);
void logEvent(String eventType, String message);
void initializeSession(String patientID);

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  
  // Initialize LED pins
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(LED_AUTH_PIN, OUTPUT);
  digitalWrite(LED_STATUS_PIN, LOW);
  digitalWrite(LED_AUTH_PIN, LOW);

  logEvent("STARTUP", "ESP32-CAM Patient Monitoring Device Initializing...");

  // Initialize Camera
  initializeCamera();

  // Initialize WiFi
  initializeWiFi();

  // UART communication with ESP32 Main
  Serial1.begin(115200, SERIAL_8N1, 3, 1);
  
  logEvent("STARTUP", "Device Ready - Waiting for Patient Authentication");
  currentState = STATE_UNAUTHENTICATED;
}

void initializeCamera() {
  logEvent("CAMERA_INIT", "Initializing camera for patient monitoring...");
  
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;

  // PSRAM optimization for patient health monitoring
  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
    logEvent("CAMERA_INIT", "PSRAM found - Using UXGA resolution for detailed health monitoring");
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
    logEvent("CAMERA_INIT", "No PSRAM - Using SVGA resolution");
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    logEvent("CAMERA_ERROR", "Camera initialization failed!");
    currentState = STATE_ERROR;
    return;
  }

  // Sensor settings optimization for patient monitoring
  sensor_t *s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_brightness(s, 0);
    s->set_contrast(s, 0);
    s->set_saturation(s, 0);
    s->set_special_effect(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_wb_mode(s, 0);
    s->set_expose_ctrl(s, 1);
    s->set_aec_value(s, 300);
    s->set_gain_ctrl(s, 1);
    s->set_agc_gain(s, 0);
    s->set_gainceiling(s, (gainceiling_t)0);
    s->set_bpc(s, 0);
    s->set_wpc(s, 1);
    s->set_raw_gma(s, 1);
    s->set_lenc(s, 1);
    s->set_hmirror(s, 0);
    s->set_vflip(s, 0);
    s->set_dcw(s, 1);
    s->set_colorbar(s, 0);
  }

  logEvent("CAMERA_INIT", "Camera initialized successfully for patient monitoring");
}

void initializeWiFi() {
  logEvent("WIFI_INIT", "Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    logEvent("WIFI_CONNECTED", "IP: " + WiFi.localIP().toString());
  } else {
    logEvent("WIFI_ERROR", "Failed to connect to WiFi");
    currentState = STATE_ERROR;
  }
}

void loop() {
  // Handle incoming UART commands from ESP32 Main
  if (Serial1.available()) {
    String command = Serial1.readStringUntil('\n');
    command.trim();
    if (command.length() > 0) {
      handleCommand(command);
    }
  }

  // Only capture and send patient data if authenticated
  unsigned long currentTime = millis();
  if (currentState == STATE_AUTHENTICATED && 
      currentTime - lastCaptureTime >= CAPTURE_INTERVAL) {
    capturePatientData();
    lastCaptureTime = currentTime;
  }

  delay(100);
}

void capturePatientData() {
  currentState = STATE_CAPTURING;
  updateLEDStatus(STATE_CAPTURING);
  logEvent("CAPTURE", "Capturing patient health data...");

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    logEvent("CAPTURE_ERROR", "Failed to get frame buffer");
    currentState = STATE_ERROR;
    updateLEDStatus(STATE_ERROR);
    return;
  }

  currentState = STATE_PROCESSING;
  logEvent("PROCESS", "Processing patient data frame - Size: " + String(fb->len) + " bytes");

  currentState = STATE_SENDING;
  updateLEDStatus(STATE_SENDING);
  
  if (sendPatientDataToServer(fb)) {
    logEvent("SEND_SUCCESS", "Patient health data sent successfully to server");
    currentState = STATE_AUTHENTICATED;
  } else {
    logEvent("SEND_ERROR", "Failed to send patient data to server");
    currentState = STATE_ERROR;
    updateLEDStatus(STATE_ERROR);
  }

  esp_camera_fb_return(fb);
  updateLEDStatus(currentState);
}

bool sendPatientDataToServer(camera_fb_t *fb) {
  if (WiFi.status() != WL_CONNECTED) {
    logEvent("WIFI_ERROR", "WiFi not connected");
    return false;
  }

  HTTPClient http;
  String uploadUrl = String(SERVER_URL) + "/api/patient/health-data";
  http.setTimeout(REQUEST_TIMEOUT);

  if (!http.begin(uploadUrl)) {
    logEvent("HTTP_ERROR", "Failed to initialize HTTP connection");
    return false;
  }

  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Device-ID", "ESP32-CAM-PATIENT-MON");
  http.addHeader("X-Patient-ID", currentSession.patientID);
  http.addHeader("X-Session-ID", currentSession.sessionID);
  http.addHeader("X-Timestamp", String(millis()));

  int httpResponseCode = http.POST(fb->buf, fb->len);

  if (httpResponseCode == 200) {
    String response = http.getString();
    logEvent("SERVER_RESPONSE", response);
    http.end();
    return true;
  } else {
    logEvent("HTTP_ERROR", "HTTP Response: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

void handleCommand(String command) {
  if (command.startsWith("AUTH:")) {
    // Authentication command from ESP32 Main after fingerprint verification
    String patientID = command.substring(5);
    initializeSession(patientID);
    currentState = STATE_AUTHENTICATED;
    updateLEDStatus(STATE_AUTHENTICATED);
    Serial1.println("CAM:AUTH_SUCCESS");
    logEvent("AUTH", "Patient " + patientID + " authenticated");
  } 
  else if (command == "LOGOUT") {
    currentState = STATE_UNAUTHENTICATED;
    updateLEDStatus(STATE_UNAUTHENTICATED);
    Serial1.println("CAM:LOGOUT");
    logEvent("AUTH", "Patient logged out");
  }
  else if (command == "CAPTURE") {
    if (currentState == STATE_AUTHENTICATED) {
      logEvent("COMMAND", "Manual health data capture requested");
      capturePatientData();
    }
  } 
  else if (command == "STATUS") {
    String status = "CAM:" + String(currentState);
    Serial1.println(status);
  } 
  else if (command.startsWith("CONFIG:")) {
    String config = command.substring(7);
    logEvent("CONFIG", "Received config: " + config);
  }
  else {
    logEvent("UNKNOWN_CMD", command);
  }
}

void initializeSession(String patientID) {
  currentSession.patientID = patientID;
  currentSession.sessionID = String(millis());
  currentSession.authenticated = true;
  currentSession.sessionStartTime = millis();
  currentSession.lastCaptureTime = millis();
  logEvent("SESSION", "New session initialized for patient: " + patientID);
}

void updateLEDStatus(CameraState state) {
  switch (state) {
    case STATE_UNAUTHENTICATED:
      digitalWrite(LED_STATUS_PIN, LOW);
      digitalWrite(LED_AUTH_PIN, LOW);
      break;
    case STATE_AUTHENTICATED:
      digitalWrite(LED_STATUS_PIN, HIGH);
      digitalWrite(LED_AUTH_PIN, HIGH);
      break;
    case STATE_CAPTURING:
      digitalWrite(LED_STATUS_PIN, HIGH);
      digitalWrite(LED_AUTH_PIN, LOW);
      break;
    case STATE_PROCESSING:
      digitalWrite(LED_STATUS_PIN, HIGH);
      digitalWrite(LED_AUTH_PIN, LOW);
      break;
    case STATE_SENDING:
      digitalWrite(LED_STATUS_PIN, HIGH);
      digitalWrite(LED_AUTH_PIN, LOW);
      break;
    case STATE_ERROR:
      digitalWrite(LED_STATUS_PIN, LOW);
      digitalWrite(LED_AUTH_PIN, HIGH);
      break;
  }
}

void logEvent(String eventType, String message) {
  String logEntry = "[" + eventType + "] " + message;
  Serial.println(logEntry);
  Serial1.println(logEntry);  // Also send to main board
}