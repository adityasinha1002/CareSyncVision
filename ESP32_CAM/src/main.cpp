#include <Arduino.h>

void setup() {
  Serial.begin(115200);  // USB
  Serial.setDebugOutput(false);
  Serial.println("ESP32-CAM Ready");

  Serial1.begin(115200, SERIAL_8N1, 3, 1);  // GPIO3 RX, GPIO1 TX
}

void loop() {
  if (Serial1.available()) {
    String command = Serial1.readStringUntil('\n');
    command.trim();

    if (command == "AUTH") {
      Serial.println("AUTH command received");

      // Simulate face detection (replace with actual logic later)
      delay(2000);
      Serial1.println("FACE_OK");  // or FACE_FAIL
    }
  }
}