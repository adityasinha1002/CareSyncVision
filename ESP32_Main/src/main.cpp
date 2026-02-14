#include <Arduino.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <time.h>

// ==============================================================================
// CARESYNVISION - ESP32 MAIN BOARD MODULE
// Role: Patient Authentication & Monitoring Orchestration Hub
// Features: Fingerprint authentication, RTC time sync, Medication scheduling
// ==============================================================================

// GPIO Configuration
#define FINGERPRINT_RX_PIN 16   // UART2 RX for fingerprint sensor
#define FINGERPRINT_TX_PIN 17   // UART2 TX for fingerprint sensor
#define RTC_SDA_PIN 21          // I2C SDA for RTC module
#define RTC_SCL_PIN 22          // I2C SCL for RTC module
#define BUTTON_PIN 19           // Manual auth trigger button
#define BUZZER_PIN 25           // Alert/notification buzzer
#define LED_AUTH_PIN 12         // Green LED - authentication status
#define LED_STATUS_PIN 13       // Blue LED - system status

// State Management
enum SystemState {
  STATE_UNAUTHENTICATED,
  STATE_AUTHENTICATING,
  STATE_AUTHENTICATED,
  STATE_MEDICATION_SCHEDULED,
  STATE_ERROR
};

SystemState systemState = STATE_UNAUTHENTICATED;

// Patient Authentication Structure
struct PatientAuth {
  String patientID;
  String patientName;
  bool authenticated;
  unsigned long authTime;
  unsigned long sessionStartTime;
  unsigned char fingerprintID;
};

PatientAuth currentPatient;

// Medication Schedule Structure
struct MedicationSchedule {
  String medicationName;
  int dosage;
  int hour;
  int minute;
  bool administered;
  unsigned long administrationTime;
};

// RTC Time Structure
struct RTCTime {
  int year;
  int month;
  int day;
  int hour;
  int minute;
  int second;
};

RTCTime currentTime;

// Hardware Serial for fingerprint sensor
HardwareSerial FingerprintSensor(2); // UART2

// Hardware Serial for ESP32-CAM communication (via UART1)
HardwareSerial ESP32CAM(1); // UART1 for CAM

// Timing Configuration
const unsigned long AUTH_CHECK_INTERVAL = 1000;     // 1 second
const unsigned long RTC_SYNC_INTERVAL = 60000;      // 60 seconds
const unsigned long MEDICATION_CHECK_INTERVAL = 5000; // 5 seconds
unsigned long lastAuthCheckTime = 0;
unsigned long lastRTCSyncTime = 0;
unsigned long lastMedicationCheckTime = 0;

// Patient Database (in production, fetch from server)
struct PatientRecord {
  String patientID;
  String patientName;
  unsigned char storedFingerprintID;
};

// Simulated patient database
const PatientRecord patientDatabase[] = {
  {"P001", "John Doe", 1},
  {"P002", "Jane Smith", 2},
  {"P003", "Robert Johnson", 3}
};
const int NUM_PATIENTS = 3;

// Medication database (would be fetched from AI server in production)
MedicationSchedule medicationSchedule[5];

// Function Prototypes
void initializeFingerprintSensor();
void initializeRTC();
void initializeCommunication();
void readFingerprintSensor();
void authenticatePatient();
void readRTCTime();
void checkMedicationSchedule();
void sendToCAM(String command);
void sendEventToServer(String eventType, String data);
void handleCAMResponse(String response);
void activateNotification(String message);
void deactivateNotification();
void updateLEDStatus(SystemState state);
void logEvent(String eventType, String message);

// ==============================================================================
// SETUP & INITIALIZATION
// ==============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n");
  
  logEvent("STARTUP", "ESP32 Main Board Initializing - Patient Authentication Module");

  // Initialize GPIO
  pinMode(BUTTON_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_AUTH_PIN, OUTPUT);
  pinMode(LED_STATUS_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_AUTH_PIN, LOW);
  digitalWrite(LED_STATUS_PIN, LOW);

  // Initialize hardware interfaces
  initializeFingerprintSensor();
  initializeRTC();
  initializeCommunication();

  systemState = STATE_UNAUTHENTICATED;
  updateLEDStatus(systemState);
  logEvent("STARTUP", "System Ready - Waiting for Patient Authentication");
}

// ==============================================================================
// MAIN LOOP
// ==============================================================================

void loop() {
  // Handle incoming CAM messages
  if (ESP32CAM.available()) {
    String message = ESP32CAM.readStringUntil('\n');
    message.trim();
    if (message.length() > 0) {
      handleCAMResponse(message);
    }
  }

  unsigned long currentMillis = millis();

  // Check authentication status
  if (currentMillis - lastAuthCheckTime >= AUTH_CHECK_INTERVAL) {
    readFingerprintSensor();
    lastAuthCheckTime = currentMillis;
  }

  // Sync RTC periodically
  if (currentMillis - lastRTCSyncTime >= RTC_SYNC_INTERVAL) {
    readRTCTime();
    lastRTCSyncTime = currentMillis;
  }

  // Check medication schedule when authenticated
  if (systemState == STATE_AUTHENTICATED) {
    if (currentMillis - lastMedicationCheckTime >= MEDICATION_CHECK_INTERVAL) {
      checkMedicationSchedule();
      lastMedicationCheckTime = currentMillis;
    }
  }

  delay(50);
}

// ==============================================================================
// FINGERPRINT SENSOR INITIALIZATION
// ==============================================================================

void initializeFingerprintSensor() {
  logEvent("FINGERPRINT_INIT", "Initializing fingerprint sensor on UART2...");
  FingerprintSensor.begin(57600, SERIAL_8N1, FINGERPRINT_RX_PIN, FINGERPRINT_TX_PIN);
  logEvent("FINGERPRINT_INIT", "Fingerprint sensor initialized at 57600 baud");
  logEvent("FINGERPRINT_INIT", "Fingerprint module ready - waiting for scan");
}

// ==============================================================================
// RTC INITIALIZATION
// ==============================================================================

void initializeRTC() {
  logEvent("RTC_INIT", "Initializing RTC module on I2C...");
  Wire.begin(RTC_SDA_PIN, RTC_SCL_PIN);
  
  // Note: Full RTC initialization would depend on specific RTC module (DS3231, PCF8563, etc.)
  // This is a placeholder - actual implementation varies by RTC chip
  logEvent("RTC_INIT", "RTC module initialized on I2C");
  logEvent("RTC_INIT", "Syncing time with NTP server...");
  
  // In production, sync with NTP server via WiFi
  currentTime.year = 2024;
  currentTime.month = 1;
  currentTime.day = 1;
  currentTime.hour = 0;
  currentTime.minute = 0;
  currentTime.second = 0;
}

// ==============================================================================
// COMMUNICATION INITIALIZATION
// ==============================================================================

void initializeCommunication() {
  logEvent("COMM_INIT", "Initializing UART1 with ESP32-CAM...");
  ESP32CAM.begin(115200, SERIAL_8N1, 5, 18); // RX=5, TX=18 (UART1)
  logEvent("COMM_INIT", "UART1 with ESP32-CAM configured at 115200 baud");
  logEvent("COMM_INIT", "Patient authentication module linked to camera system");
}

// ==============================================================================
// FINGERPRINT AUTHENTICATION
// ==============================================================================

void readFingerprintSensor() {
  // Check if fingerprint data available
  if (FingerprintSensor.available()) {
    String fingerprintData = FingerprintSensor.readStringUntil('\n');
    fingerprintData.trim();
    
    if (fingerprintData.length() > 0) {
      logEvent("FINGERPRINT", "Scan detected: " + fingerprintData);
      
      // Parse fingerprint data (format depends on sensor module)
      // Simplified: extract fingerprint ID from sensor response
      unsigned char scannedFingerprintID = fingerprintData.toInt();
      
      if (scannedFingerprintID > 0) {
        authenticatePatient();
      }
    }
  }
  
  // Check manual auth button
  if (digitalRead(BUTTON_PIN) == HIGH) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == HIGH) {
      logEvent("BUTTON", "Manual authentication trigger pressed");
      // In production, would prompt for fingerprint
      delay(500);
    }
  }
}

void authenticatePatient() {
  // Simulate fingerprint matching with patient database
  // In production: match scanned fingerprint with stored fingerprints and fetch patient record
  
  // For demo, use patient P001
  String patientID = "P001";
  String patientName = "John Doe";
  unsigned char fingerprintID = 1;
  
  currentPatient.patientID = patientID;
  currentPatient.patientName = patientName;
  currentPatient.fingerprintID = fingerprintID;
  currentPatient.authenticated = true;
  currentPatient.authTime = millis();
  currentPatient.sessionStartTime = millis();
  
  systemState = STATE_AUTHENTICATED;
  updateLEDStatus(systemState);
  
  logEvent("AUTH", "Patient authenticated: " + patientName + " (" + patientID + ")");
  activateNotification("Patient authenticated");
  
  // Send authentication to ESP32-CAM
  sendToCAM("AUTH:" + patientID);
  
  // Fetch medication schedule from AI server
  sendEventToServer("AUTH_SUCCESS", "Patient " + patientID + " authenticated");
}

// ==============================================================================
// RTC TIME MANAGEMENT
// ==============================================================================

void readRTCTime() {
  // Read current time from RTC module
  // Implementation depends on specific RTC chip
  // This is a placeholder - actual code varies by module (DS3231, PCF8563, etc.)
  
  logEvent("RTC", "Current time: " + String(currentTime.hour) + ":" + 
           String(currentTime.minute) + ":" + String(currentTime.second) +
           " on " + String(currentTime.day) + "/" + String(currentTime.month) + 
           "/" + String(currentTime.year));
}

// ==============================================================================
// MEDICATION SCHEDULING & MONITORING
// ==============================================================================

void checkMedicationSchedule() {
  // Check if it's time to administer medication
  for (int i = 0; i < 5; i++) {
    if (medicationSchedule[i].medicationName.length() == 0) continue;
    
    if (!medicationSchedule[i].administered &&
        currentTime.hour == medicationSchedule[i].hour &&
        currentTime.minute == medicationSchedule[i].minute) {
      
      // Time to administer medication
      logEvent("MEDICATION", "Time for medication: " + medicationSchedule[i].medicationName);
      activateNotification("Take medication: " + medicationSchedule[i].medicationName);
      
      medicationSchedule[i].administered = true;
      medicationSchedule[i].administrationTime = millis();
      
      // Send event to server with patient response
      sendEventToServer("MEDICATION_TIME", 
        "Patient " + currentPatient.patientID + " - Medication: " + 
        medicationSchedule[i].medicationName);
    }
    
    // Reset administered flag at midnight
    if (currentTime.hour == 0 && currentTime.minute == 0) {
      medicationSchedule[i].administered = false;
    }
  }
}

// ==============================================================================
// COMMUNICATION FUNCTIONS
// ==============================================================================

void sendToCAM(String command) {
  ESP32CAM.println(command);
  logEvent("SEND_CAM", "Sent: " + command);
}

void handleCAMResponse(String response) {
  logEvent("CAM_MSG", response);

  if (response.indexOf("CAM:AUTH_SUCCESS") >= 0) {
    logEvent("EVENT", "Camera authentication confirmed");
  }
  else if (response.indexOf("[CAPTURE]") >= 0) {
    logEvent("EVENT", "Patient health data captured by camera");
  }
  else if (response.indexOf("[SEND_SUCCESS]") >= 0) {
    logEvent("EVENT", "Patient health data sent to server successfully");
  }
  else if (response.indexOf("CAM:LOGOUT") >= 0) {
    logEvent("EVENT", "Patient logging out - stopping monitoring");
    currentPatient.authenticated = false;
    systemState = STATE_UNAUTHENTICATED;
    updateLEDStatus(systemState);
  }
}

void sendEventToServer(String eventType, String data) {
  // In production, send to AI server via WiFi/MQTT
  // For now, logged locally
  logEvent("SERVER_EVENT", eventType + ": " + data);
  
  // Example: AI server would receive:
  // - AUTH_SUCCESS: Trigger medication schedule fetch
  // - MEDICATION_TIME: Patient prompted for medication
  // - HEALTH_DATA: Analyze behavioral patterns
  // - RESPONSE_RECORDED: Log patient response to medication
}

// ==============================================================================
// NOTIFICATION & LED STATUS
// ==============================================================================

void activateNotification(String message) {
  // Activate buzzer for notification
  digitalWrite(BUZZER_PIN, HIGH);
  logEvent("NOTIFICATION", message);
  
  // Buzzer pattern: 3 short beeps for authentication, continuous for medication
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void deactivateNotification() {
  digitalWrite(BUZZER_PIN, LOW);
  logEvent("NOTIFICATION", "Alert deactivated");
}

void updateLEDStatus(SystemState state) {
  // LED status mapping:
  // LED_AUTH_PIN (Blue): Authentication status
  // LED_STATUS_PIN (Green): System operational status
  
  switch (state) {
    case STATE_UNAUTHENTICATED:
      digitalWrite(LED_AUTH_PIN, LOW);      // Blue OFF
      digitalWrite(LED_STATUS_PIN, LOW);    // Green OFF
      logEvent("LED", "Unauthenticated mode - LEDs off");
      break;
      
    case STATE_AUTHENTICATING:
      digitalWrite(LED_AUTH_PIN, HIGH);     // Blue blinking (simulated with HIGH)
      digitalWrite(LED_STATUS_PIN, LOW);    // Green OFF
      logEvent("LED", "Authenticating - Blue LED on");
      break;
      
    case STATE_AUTHENTICATED:
      digitalWrite(LED_AUTH_PIN, HIGH);     // Blue ON
      digitalWrite(LED_STATUS_PIN, HIGH);   // Green ON
      logEvent("LED", "Authenticated - Both LEDs on");
      break;
      
    case STATE_MEDICATION_SCHEDULED:
      digitalWrite(LED_AUTH_PIN, HIGH);     // Blue ON
      digitalWrite(LED_STATUS_PIN, HIGH);   // Green ON
      logEvent("LED", "Medication scheduled - Both LEDs on");
      break;
      
    case STATE_ERROR:
      digitalWrite(LED_AUTH_PIN, LOW);      // Blue OFF
      digitalWrite(LED_STATUS_PIN, HIGH);   // Green ON (error state)
      logEvent("LED", "Error state - Green LED on");
      break;
  }
}

// ==============================================================================
// LOGGING
// ==============================================================================

void logEvent(String eventType, String message) {
  String timestamp = "[" + String(millis() / 1000) + "s]";
  String logEntry = timestamp + " [" + eventType + "] " + message;
  Serial.println(logEntry);
}