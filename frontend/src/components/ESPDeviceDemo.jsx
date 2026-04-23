import { useState, useEffect } from 'react';
import { Bluetooth, AlertCircle, CheckCircle } from 'lucide-react';
import { espDeviceService } from '../services/api';

/**
 * ESPDeviceDemo Component
 * 
 * Displays a demo toggle for ESP32 Bluetooth device connection.
 * In demo mode, users can:
 * - See connection status
 * - Attempt to connect to their ESP32 device
 * - View setup instructions
 * 
 * Full integration coming in Phase 2 when mobile app is ready.
 */
export const ESPDeviceDemo = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial device status
    fetchDeviceStatus();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const response = await espDeviceService.getStatus();
      const data = response.data;
      setConnected(data.connected);
      setDeviceInfo(data);
    } catch (err) {
      console.error('Failed to fetch device status:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await espDeviceService.connect(`ESP32-${Date.now()}`);
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        // In demo mode, show instructions instead of false connection
        setShowInstructions(true);
      } else {
        setError(data.error || 'Failed to connect device');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    
    try {
      await espDeviceService.disconnect();
      
      setConnected(false);
      setShowInstructions(false);
      setDeviceInfo(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border border-primary/25 p-3 rounded-full">
            <Bluetooth className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">ESP32 Device</h3>
            <p className="text-xs text-gray-600 font-mono">Demo Mode · Coming Soon</p>
          </div>
        </div>
        {connected ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-bold">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600 text-sm">Not Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-700/40 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Device Info */}
      {deviceInfo && !connected && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded text-sm text-primary font-mono">
          <p className="font-bold">Device ID: {deviceInfo.device_id}</p>
          <p className="text-xs mt-1 text-gray-500">{deviceInfo.message}</p>
        </div>
      )}

      {/* Connection Instructions */}
      {showInstructions && (
        <div className="mb-4 p-4 bg-yellow-950/30 border border-yellow-700/40 rounded">
          <h4 className="font-bold text-yellow-400 mb-2 text-sm uppercase tracking-wide">Setup Instructions</h4>
          <ol className="text-sm text-yellow-500/80 space-y-2 list-decimal list-inside font-mono text-xs">
            <li>Download the ESP32 firmware from the provided link</li>
            <li>Flash the firmware to your ESP32 board using Arduino IDE</li>
            <li>Power on the ESP32 device</li>
            <li>Scan for Bluetooth devices in your mobile app</li>
            <li>Select "CareSyncVision-ESP32" from available devices</li>
            <li>Enter the pairing code: <span className="bg-black/40 px-2 py-0.5 rounded text-primary">123456</span></li>
            <li>Grant permissions for health sensor access</li>
            <li>Wait for data synchronization to complete</li>
          </ol>
          <div className="mt-4 space-y-2">
            <a
              href="https://github.com/adityasinha1002/CareSyncVision/tree/main/ESP32_Main"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2 bg-primary text-black rounded text-sm font-bold hover:bg-primary-400 transition"
            >
              Download ESP32 Firmware
            </a>
            <a
              href="/docs/esp32-setup"
              className="block text-center px-4 py-2 bg-transparent border border-primary/40 text-primary rounded text-sm font-bold hover:bg-primary/5 transition"
            >
              View Complete Setup Guide
            </a>
          </div>
        </div>
      )}

      {/* Status Details */}
      {deviceInfo && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-[#0d0d0d] rounded p-2 border border-[#2a2a2a]">
            <p className="text-xs text-gray-600 uppercase tracking-wider">Battery Level</p>
            <p className="font-bold text-primary font-mono">{deviceInfo.battery_level}%</p>
          </div>
          <div className="bg-[#0d0d0d] rounded p-2 border border-[#2a2a2a]">
            <p className="text-xs text-gray-600 uppercase tracking-wider">Signal Strength</p>
            <p className="font-bold text-primary font-mono">{deviceInfo.signal_strength}%</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!connected ? (
          <>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 btn-primary py-2 text-sm"
            >
              {loading ? 'Connecting...' : 'Connect Device'}
            </button>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {showInstructions ? 'Hide' : 'Help'}
            </button>
          </>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full btn-danger py-2 text-sm font-bold"
          >
            {loading ? 'Disconnecting...' : 'Disconnect Device'}
          </button>
        )}
      </div>

      {/* Demo Notice */}
      <div className="mt-4 p-3 bg-yellow-950/20 border border-yellow-700/30 rounded text-xs text-yellow-600">
        <p className="font-bold text-yellow-500">⚡ Demo Mode</p>
        <p className="mt-1">
          Full Bluetooth integration with real-time health monitoring will be available in Phase 2 when the mobile app is released.
        </p>
      </div>
    </div>
  );
};
