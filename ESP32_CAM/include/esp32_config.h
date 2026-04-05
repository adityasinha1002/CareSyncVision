#ifndef ESP32_CONFIG_H
#define ESP32_CONFIG_H

#include <Arduino.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

// EEPROM Configuration
#define EEPROM_SIZE 512
#define CONFIG_OFFSET 0
#define AUTH_TOKEN "CARE"  // Magic token to verify EEPROM validity

// WiFi Configuration Structure
struct WiFiConfig {
    char token[4];           // Magic token "CARE"
    char ssid[32];           // WiFi SSID (max 31 chars)
    char password[64];       // WiFi password (max 63 chars)
    char serverUrl[128];     // Server URL (max 127 chars)
    uint32_t checksum;       // Checksum for validation
};

// ConfigManager Class - Handles EEPROM persistence
class ConfigManager {
private:
    WiFiConfig config;
    bool isValid;
    
    // Calculate checksum for data integrity
    uint32_t calculateChecksum() {
        uint32_t checksum = 0;
        char* ptr = (char*)&config;
        for (int i = 0; i < sizeof(WiFiConfig) - 4; i++) {
            checksum += ptr[i];
        }
        return checksum;
    }
    
    // Initialize with factory defaults
    void initializeDefaults() {
        memset(&config, 0, sizeof(WiFiConfig));
        strcpy(config.token, AUTH_TOKEN);
        strcpy(config.ssid, "NOT_CONFIGURED");
        strcpy(config.password, "NOT_CONFIGURED");
        strcpy(config.serverUrl, "http://192.168.1.1:5000");
        config.checksum = calculateChecksum();
        isValid = false;
    }
    
public:
    ConfigManager() {
        initializeDefaults();
        loadFromEEPROM();
    }
    
    // Load configuration from EEPROM
    bool loadFromEEPROM() {
        EEPROM.begin(EEPROM_SIZE);
        EEPROM.get(CONFIG_OFFSET, config);
        EEPROM.end();
        
        // Validate magic token
        if (strncmp(config.token, AUTH_TOKEN, 4) != 0) {
            Serial.println("[CONFIG] No valid config found in EEPROM. Using defaults.");
            initializeDefaults();
            isValid = false;
            return false;
        }
        
        // Validate checksum
        uint32_t calc_checksum = calculateChecksum();
        if (calc_checksum != config.checksum) {
            Serial.println("[CONFIG] Checksum mismatch. Config may be corrupted.");
            isValid = false;
            return false;
        }
        
        isValid = true;
        Serial.println("[CONFIG] Valid config loaded from EEPROM");
        return true;
    }
    
    // Save configuration to EEPROM
    bool saveToEEPROM(const char* ssid, const char* password, const char* serverUrl) {
        // Validate input lengths
        if (strlen(ssid) >= 32 || strlen(password) >= 64 || strlen(serverUrl) >= 128) {
            Serial.println("[CONFIG_ERROR] Input strings too long!");
            return false;
        }
        
        // Update config
        strcpy(config.token, AUTH_TOKEN);
        strcpy(config.ssid, ssid);
        strcpy(config.password, password);
        strcpy(config.serverUrl, serverUrl);
        config.checksum = calculateChecksum();
        
        // Write to EEPROM
        EEPROM.begin(EEPROM_SIZE);
        EEPROM.put(CONFIG_OFFSET, config);
        bool success = EEPROM.commit();
        EEPROM.end();
        
        if (success) {
            Serial.println("[CONFIG] Configuration saved to EEPROM successfully");
            isValid = true;
        } else {
            Serial.println("[CONFIG_ERROR] Failed to commit configuration to EEPROM");
        }
        
        return success;
    }
    
    // Getter functions
    const char* getSSID() { 
        return (isValid || strcmp(config.ssid, "NOT_CONFIGURED") != 0) ? config.ssid : "NOT_CONFIGURED"; 
    }
    
    const char* getPassword() { 
        return (isValid || strcmp(config.password, "NOT_CONFIGURED") != 0) ? config.password : "NOT_CONFIGURED"; 
    }
    
    const char* getServerUrl() { 
        return (isValid || strcmp(config.serverUrl, "http://192.168.1.1:5000") != 0) ? config.serverUrl : "http://192.168.1.1:5000"; 
    }
    
    bool isConfigured() {
        return isValid && strcmp(config.ssid, "NOT_CONFIGURED") != 0;
    }
    
    void printConfig() {
        Serial.println("\n========== Current Configuration ==========");
        Serial.print("SSID: ");
        Serial.println(config.ssid);
        Serial.print("Password: ");
        Serial.println(strcmp(config.password, "NOT_CONFIGURED") == 0 ? "(not set)" : "***");
        Serial.print("Server URL: ");
        Serial.println(config.serverUrl);
        Serial.print("Valid: ");
        Serial.println(isValid ? "YES" : "NO");
        Serial.println("==========================================\n");
    }
};

#endif  // ESP32_CONFIG_H
