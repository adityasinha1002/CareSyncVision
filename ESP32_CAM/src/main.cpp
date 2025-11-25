#include <Arduino.h>
#include <esp_camera.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Function prototypes
void handleCommand(String command);
String performFaceDetection();
bool sendImageToServer(camera_fb_t *fb);

// WiFi credentials
const char* ssid = "your-SSID";
const char* password = "your-PASSWORD";

// Python server URL
const char* serverUrl = "http://your-server-ip:your-port/upload";

// Define pin mappings for ESP32-CAM
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

void setup() {
  Serial.begin(115200);  // USB
  Serial.setDebugOutput(false);
  Serial.println("ESP32-CAM Ready");

  Serial1.begin(115200, SERIAL_8N1, 3, 1);  // GPIO3 RX, GPIO1 TX

  // Initialize camera
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

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.println("Camera init failed");
    return;
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  if (Serial1.available()) {
    String command = Serial1.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
}

void handleCommand(String command) {
  if (command.length() == 0 || command.length() > 20) {
    Serial1.println("ERROR: Invalid command length");
    return;
  }

  if (command == "AUTH") {
    Serial.println("AUTH command received");
    String result = performFaceDetection();
    Serial1.println(result);
  } else {
    Serial.println("Unknown command received: " + command);
    Serial1.println("ERROR: Unknown command");
  }
}

String performFaceDetection() {
  Serial.println("Performing face detection...");

  const int max_failures = 3;
  static int failure_count = 0;

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    failure_count++;
    if (failure_count >= max_failures) {
      Serial.println("Camera failed repeatedly. Restarting...");
      ESP.restart();
    }
    return "FACE_FAIL";
  }

  failure_count = 0; // Reset failure counter on success

  // Send image to Python server
  if (!sendImageToServer(fb)) {
    Serial.println("Failed to send image to server");
    esp_camera_fb_return(fb);
    return "FACE_FAIL";
  }

  esp_camera_fb_return(fb);

  // Placeholder: Simulate face detection logic
  bool faceDetected = random(0, 2); // Randomly simulate face detection (0 or 1)

  return faceDetected ? "FACE_OK" : "FACE_FAIL";
}

bool sendImageToServer(camera_fb_t *fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "image/jpeg");

  int httpResponseCode = http.POST(fb->buf, fb->len);

  if (httpResponseCode > 0) {
    Serial.printf("Image sent successfully, response code: %d\n", httpResponseCode);
  } else {
    Serial.printf("Failed to send image, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  return httpResponseCode > 0;
}