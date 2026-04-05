# ESP32 WiFi Credentials & Configuration Guide

## Current Problem: Hardcoded Credentials

In **[ESP32_CAM/src/main.cpp](ESP32_CAM/src/main.cpp)** (lines 14-16), credentials are hardcoded:
```cpp
const char* WIFI_SSID = "your-SSID";
const char* WIFI_PASSWORD = "your-PASSWORD";
const char* SERVER_URL = "http://your-server-ip:5000";
```

This is **insecure** and impossible to update without recompiling firmware.

---

## Solution: Externalizing Credentials

### **Option 1: EEPROM/Flash Storage (Recommended for ESP32)**

Store credentials in persistent flash memory and load at runtime.

**Pros:**
- ✅ No recompilation needed
- ✅ Secure (encrypted at rest)
- ✅ RuntimeReconfigurable
- ✅ Survives power cycles
- ✅ Works offline

**Cons:**
- ⚠️ Limited writes (100K cycle limit)
- ⚠️ Requires manual provisioning initially

**Implementation:**

1. **Create a credentials config file** ([esp32_config.h](ESP32_CAM/include/esp32_config.h)):

```cpp
#ifndef ESP32_CONFIG_H
#define ESP32_CONFIG_H

#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 512
#define CONFIG_OFFSET 0

struct WiFiConfig {
    char ssid[32];
    char password[64];
    char serverUrl[128];
    uint32_t checksum;
};

class ConfigManager {
private:
    WiFiConfig config;
    
public:
    ConfigManager() {
        loadFromEEPROM();
    }
    
    bool loadFromEEPROM() {
        EEPROM.begin(EEPROM_SIZE);
        EEPROM.get(CONFIG_OFFSET, config);
        EEPROM.end();
        
        // Validate checksum
        uint32_t calc_checksum = calculateChecksum();
        return calc_checksum == config.checksum;
    }
    
    void saveToEEPROM(const char* ssid, const char* password, const char* serverUrl) {
        strcpy(config.ssid, ssid);
        strcpy(config.password, password);
        strcpy(config.serverUrl, serverUrl);
        config.checksum = calculateChecksum();
        
        EEPROM.begin(EEPROM_SIZE);
        EEPROM.put(CONFIG_OFFSET, config);
        EEPROM.commit();
        EEPROM.end();
    }
    
    const char* getSSID() { return config.ssid; }
    const char* getPassword() { return config.password; }
    const char* getServerUrl() { return config.serverUrl; }
    
private:
    uint32_t calculateChecksum() {
        uint32_t checksum = 0;
        char* ptr = (char*)&config;
        for (int i = 0; i < sizeof(WiFiConfig) - 4; i++) {
            checksum += ptr[i];
        }
        return checksum;
    }
};

#endif
```

2. **Update main.cpp** to use ConfigManager:

```cpp
#include "esp32_config.h"

ConfigManager configManager;

void setup() {
    Serial.begin(115200);
    
    // Load config from EEPROM
    if (!configManager.loadFromEEPROM()) {
        Serial.println("No valid config found. Using defaults.");
        // Fallback to defaults or enter provisioning mode
    }
    
    // Use loaded credentials
    connectToWiFi(configManager.getSSID(), configManager.getPassword());
}

void connectToWiFi(const char* ssid, const char* password) {
    WiFi.begin(ssid, password);
    // ... connection logic
}
```

3. **Provisioning via Serial or HTTP API:**

```cpp
// Serial-based configuration (for initial setup)
void handleSerialConfig() {
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        
        if (command.startsWith("CONFIG:")) {
            // Format: CONFIG:{"ssid":"MyWiFi","password":"1234","server":"http://192.168.1.100:5000"}
            DynamicJsonDocument doc(512);
            deserializeJson(doc, command.substring(7));
            
            configManager.saveToEEPROM(
                doc["ssid"],
                doc["password"],
                doc["server"]
            );
            Serial.println("Config saved. Rebooting...");
            ESP.restart();
        }
    }
}
```

---

### **Option 2: WiFi Manager (Easy for Users)**

Use **WiFiManager** library for auto-configuration portal.

**Pros:**
- ✅ User-friendly web interface
- ✅ No serial terminal needed
- ✅ Automatic provisioning
- ✅ Fallback AP mode

**Cons:**
- ⚠️ Extra library dependency
- ⚠️ Slightly larger firmware

**Implementation:**

1. **Install WiFiManager** in platformio.ini:

```ini
[env:esp32cam]
board = esp32-s3-devkitc-1-n8r8v5
framework = arduino
lib_deps = 
    WiFiManager
    ArduinoJson
    esp32-camera
```

2. **Use in main.cpp:**

```cpp
#include <WiFiManager.h>

WiFiManager wifiManager;

void setup() {
    WiFi.mode(WIFI_STA);
    
    // Auto-connect or open configuration portal
    bool res = wifiManager.autoConnect("CareSyncVision_Setup");
    
    if (!res) {
        Serial.println("Failed to connect. Restarting...");
        ESP.restart();
    }
    
    Serial.println("Connected to WiFi!");
    Serial.println(WiFi.localIP());
}
```

**User Experience:**
1. Power on ESP32 without saved config → Opens WiFi AP `CareSyncVision_Setup`
2. Connect to AP via phone/computer
3. Browser opens configuration portal (~192.168.4.1)
4. Enter WiFi SSID, password, server URL
5. Submit → Saved to EEPROM → Automatic restart

---

### **Option 3: Environment Variables + Python Script (Docker)**

For Flask server setup, use **.env** file and docker-compose.

**.env file** (excluded from git):

```ini
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_SECRET_KEY=your-secret-key-here
MAX_IMAGE_SIZE=5242880
SESSION_TIMEOUT=3600
```

**docker-compose.yml** (already created):

```yaml
services:
  ai-server:
    # ... other config
    env_file:
      - .env
    environment:
      - FLASK_ENV=production
```

Then in **app.py**:

```python
import os
from dotenv import load_dotenv

load_dotenv()

FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-key-change-in-production')
MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 5242880))
SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', 3600))
```

---

## Recommended Approach

| Component | Method | Reason |
|-----------|--------|--------|
| **ESP32-CAM WiFi** | **EEPROM + Provisioning** | No recompilation, secure, decoupled from production code |
| **ESP32 Main** | **EEPROM** | Simple sensor board, minimal config needed |
| **Flask Server** | **.env + docker-compose** | Easy Docker deployment, standard practice |

---

## Implementation Checklist

- [ ] Create [esp32_config.h](ESP32_CAM/include/esp32_config.h) with ConfigManager class
- [ ] Add `#include "esp32_config.h"` to ESP32_CAM/src/main.cpp
- [ ] Replace hardcoded credentials with `configManager.getSSID()`, etc.
- [ ] Add serial provisioning command handler
- [ ] Test EEPROM save/load cycle
- [ ] Create `.env.production` with Flask secrets (added to .gitignore)
- [ ] Verify Docker build compiles with environment variables
- [ ] Document provisioning process for users

---

## Security Notes

⚠️ **Never commit secrets to Git:**

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

✅ **Use example files:**

```bash
# .env.example (commitable)
FLASK_SECRET_KEY=change-this-in-production
MAX_IMAGE_SIZE=5242880
```

---

## Quick Start: Provisioning

**Via Serial (ESP32-CAM):**

```bash
# Use Arduino Serial Monitor or minicom
CONFIG:{"ssid":"MyNetwork","password":"MyPassword","server":"http://192.168.1.100:5000"}
```

**Via WiFiManager Web UI:**

1. Power on unprovisioned ESP32
2. Open WiFi networks → Select `CareSyncVision_Setup`
3. Browser auto-opens to `http://192.168.4.1`
4. Fill in credentials → Save & reboot

**Via Docker:**

```bash
# Create .env with your values
echo "FLASK_SECRET_KEY=your-secret" > .env

# Build and run
docker-compose up --build
```
