#include <Arduino.h>
#include <Wire.h>

#define TOUCH_PIN 4

HardwareSerial ESP32CAM(2); // UART2 -> GPIO16 RX, GPIO17 TX

void setup() {
  Serial.begin(115200);
  ESP32CAM.begin(115200, SERIAL_8N1, 16, 17); // RX, TX
  pinMode(TOUCH_PIN, INPUT);

  Serial.println("ESP32 Main Ready...");
}

void loop() {
  if (digitalRead(TOUCH_PIN) == HIGH) {
    Serial.println("Touch detected. Requesting face auth...");
    ESP32CAM.println("AUTH");

    delay(3000);  // Wait for ESP32-CAM response

    if (ESP32CAM.available()) {
      String response = ESP32CAM.readStringUntil('\n');
      Serial.println("ESP32-CAM: " + response);

      if (response == "FACE_OK") {
        Serial.println("Access Granted. Talking to ChatGPT...");
        // Call ChatGPT API logic here
      } else {
        Serial.println("Face not recognized. Try again.");
      }
    }
  }

  delay(500);
}