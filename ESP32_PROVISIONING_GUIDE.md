# ESP32-CAM WiFi Provisioning Guide

## Overview

The ESP32-CAM board now uses **EEPROM-based credential storage** instead of hardcoded WiFi and server details. This allows runtime reconfiguration without recompilation.

---

## Configuration System Architecture

### ConfigManager Class (esp32_config.h)

- **Persistent Storage**: Saves to ESP32 EEPROM at offset 0 (512 bytes)
- **Data Validation**: Magic token ("CARE") + checksum verification
- **Auto-Load**: Credentials loaded at boot automatically
- **Factory Defaults**: Falls back to safe defaults if no valid config found

### EEPROM Layout

```
Offset  |  Field         |  Size    |  Notes
--------|----------------|----------|---------------------
0-4     |  token         |  4 bytes |  Magic: "CARE"
4-36    |  ssid          |  32 bytes|  WiFi network name
36-100  |  password      |  64 bytes|  WiFi password
100-228 |  serverUrl     |  128     |  AI Server address
228-232 |  checksum      |  4 bytes |  Data integrity check
```

---

## Setup & Provisioning Methods

### Method 1: Serial Console (RECOMMENDED - No Tools Needed)

#### Step 1: Connect to Serial
```bash
# macOS/Linux
screen /dev/tty.SLAB_USBtoUART 115200

# Windows (use PuTTY or similar)
# COM Port: 9600 to 115200 baud (typically 115200)
```

#### Step 2: Verify Device is Ready
You should see:
```
[STARTUP] ESP32-CAM Patient Monitoring Device Initializing...
[CAMERA_INIT] Camera initialized successfully...
========== Current Configuration ==========
SSID: NOT_CONFIGURED
Password: (not set)
Server URL: http://192.168.1.1:5000
Valid: NO
==========================================
[WIFI_INIT] WiFi not provisioned. Awaiting configuration via Serial.
```

#### Step 3: Type HELP
```
> HELP

========== ESP32-CAM Configuration Commands ==========
CONFIG                    - Show current configuration
CONFIG:{...}              - Save WiFi credentials (JSON format)
RESET                     - Factory reset (EEPROM will be cleared)
HELP                      - Show this help message

Example provisioning command:
CONFIG:{"ssid":"MyWiFi","password":"MyPassword","server":"http://192.168.1.100:5000"}
======================================================
```

#### Step 4: Send Configuration Command

**Paste this into Serial Monitor** (customize your values):

```json
CONFIG:{"ssid":"YourWiFiNetwork","password":"YourWiFiPassword","server":"http://192.168.1.100:5000"}
```

**Example:**
```json
CONFIG:{"ssid":"HomeNetwork","password":"SecurePass123","server":"http://192.168.1.50:5000"}
```

#### Step 5: Verify Success

The device will respond:
```
[CONFIG_SUCCESS] Configuration saved. Rebooting...
✓ Configuration saved successfully!
========== Current Configuration ==========
SSID: HomeNetwork
Password: ***
Server URL: http://192.168.1.50:5000
Valid: YES
==========================================

[STARTUP] ESP32-CAM Patient Monitoring Device Initializing...
[WIFI_INIT] Connecting to WiFi: HomeNetwork
[WIFI_CONNECTED] IP: 192.168.1.45
```

---

### Method 2: Arduino IDE Serial Monitor

1. **Open Arduino IDE**
2. **Tools → Serial Monitor** (Baud: 115200)
3. **Type command** in input field at bottom
4. **Press Send**:
```
CONFIG:{"ssid":"MySSID","password":"MyPassword","server":"http://192.168.1.100:5000"}
```

---

### Method 3: PlatformIO Serial Monitor

1. **Open PlatformIO Terminal**
2. **Run**:
```bash
pio device monitor -b 115200 -p /dev/tty.SLAB_USBtoUART
```

3. **Send provisioning command** (same JSON format as above)

---

## Configuration Reference

### JSON Field Validation

| Field | Type | Max Length | Required | Example |
|-------|------|-----------|----------|---------|
| **ssid** | String | 31 chars | YES | `"HomeWiFi"` |
| **password** | String | 63 chars | YES | `"SecurePassword123"` |
| **server** | String | 127 chars | YES | `"http://192.168.1.50:5000"` |

### Server URL Formats

Valid server URLs:
```
http://192.168.1.100:5000
http://caresynvision.example.com:5000
http://localhost:5000
http://10.0.0.1:8080
```

---

## Configuration Management Commands

### Show Current Config
```
CONFIG
```
Output:
```
========== Current Configuration ==========
SSID: HomeNetwork
Password: ***
Server URL: http://192.168.1.50:5000
Valid: YES
==========================================
```

### Save New Configuration
```
CONFIG:{"ssid":"NewSSID","password":"NewPassword","server":"http://newserver:5000"}
```

### Factory Reset (EEPROM Wipe)
```
RESET
```
This clears all stored credentials. Device will boot into unconfigured state.

---

## Troubleshooting

### Issue: "JSON parse failed"

**Problem**: JSON format is invalid

**Solution**: 
- Check for matching quotes `"` on all fields
- Ensure no special characters in password (or escape them)
- Verify URL format (include `http://` or `https://`)

**Example - Wrong:**
```
CONFIG:{"ssid":"My WiFi","password":"Pass123","server":"192.168.1.1:5000"}
                          ↑ Space unescaped!     ↑ Missing http://
```

**Example - Correct:**
```
CONFIG:{"ssid":"My_WiFi","password":"Pass123","server":"http://192.168.1.1:5000"}
```

### Issue: "Configuration saved" but WiFi won't connect

**Possible Causes**:
1. WiFi password incorrect
2. SSID is 2.4GHz-only (ESP32 doesn't support 5GHz)
3. WiFi network is hidden

**Debug Steps**:
```
# Check saved config
CONFIG

# Try different network
CONFIG:{"ssid":"AnotherNetwork","password":"Password123","server":"http://192.168.1.1:5000"}
```

### Issue: Server URL not resolving

**Problem**: ESP32 can't reach the Flask server

**Debug**:
1. Check server URL in config:
   ```
   CONFIG
   ```
2. Verify Flask server is running:
   ```bash
   curl http://192.168.1.50:5000/api/health
   ```
3. Check ESP32 can ping server:
   - Install diagnostic code or use Network analysis
4. Ensure firewall allows port 5000

---

## Docker Deployment - Configuration Integration

### When Running Flask Server in Docker

1. **Set Flask environment** in `docker-compose.yml`:
   ```yaml
   environment:
     - SERVER_URL=http://docker_host_ip:5000
   ```

2. **Find Docker host IP**:
   ```bash
   # On Docker Desktop (macOS/Windows)
   docker inspect bridge | grep Gateway
   # Usually: 172.17.0.1
   
   # Or use your machine IP
   ifconfig | grep inet
   ```

3. **Configure ESP32 with Docker host IP**:
   ```
   CONFIG:{"ssid":"YourWiFi","password":"YourPassword","server":"http://172.17.0.1:5000"}
   ```

---

## Security Best Practices

### ✅ DO:
- Change FLASK_SECRET_KEY in `.env` for production
- Use strong WiFi passwords (16+ chars, mixed case)
- Avoid sharing provisioning logs with credentials
- Verify EEPROM has valid checksum (shows "Valid: YES")

### ❌ DON'T:
- Hardcode credentials in source code
- Share provisioning commands publicly
- Use simple passwords on open networks
- Expose configuration over unencrypted channels

---

## EEPROM Data Persistence

### Erase EEPROM (Recovery)

If EEPROM is corrupted, use platformio.ini:

```ini
[env:esp32cam]
board = esp32-s3-devkitc-1-n8r8v5
framework = arduino
upload_flags = 
    --erase-all
```

Then upload:
```bash
pio run -t upload
```

This will clear all settings. Device will be back to factory defaults.

---

## Testing Checklist

- [ ] ESP32-CAM boots successfully
- [ ] Serial shows "NOT_CONFIGURED" message
- [ ] Can send HELP command and receive output
- [ ] Can send CONFIG command with sample values
- [ ] CONFIG confirmation message received
- [ ] Device reboots automatically
- [ ] WiFi connects to specified network
- [ ] Server URL is printed correctly
- [ ] Can ping Flask server from ESP32
- [ ] Camera images start uploading to server

---

## Next Steps

1. **Configure ESP32-CAM** using these instructions
2. **Check Flask server** is running:
   ```bash
   docker-compose up
   # or
   python ai-server/app.py
   ```
3. **Monitor ESP32 logs** for successful authentication
4. **Verify images** appear in `uploads/` directory

---

## Reference: Complete System Flow

```
┌─────────────────────────────────────────────────────────┐
│  Power ON ESP32-CAM                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
            Check EEPROM for config
                     │
         ┌───────────┴───────────┐
         │                       │
     Valid Config          No Valid Config
         │                       │
         ▼                       ▼
   Connect to WiFi       Wait for Serial Command
         │                (CONFIG:...)
         ▼                       │
  Authenticate                  ▼
  with Main Board         Save & Restart
         │                       │
         ▼                       └──────┐
  Ready for Image                      │
  Capture & Upload                     │
                                       ▼
                              Repeat flow...
```

---

## Get Help

Commands available at device:
```
HELP        - Show all available commands
CONFIG      - Display current configuration  
CONFIG:{..} - Save new configuration
RESET       - Factory reset
```

Or consult the complete guide: [ESP32_CONFIG_GUIDE.md](../ESP32_CONFIG_GUIDE.md)
