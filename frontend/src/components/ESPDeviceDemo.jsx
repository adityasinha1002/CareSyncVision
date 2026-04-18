import { useState, useEffect } from 'react';
import { Bluetooth, AlertCircle, CheckCircle } from 'lucide-react';

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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/esp-device/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        setDeviceInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch device status:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/esp-device/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: `ESP32-${Date.now()}`,
          connection_method: 'bluetooth'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
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
      const token = localStorage.getItem('token');
      await fetch('/api/esp-device/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Bluetooth className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">ESP32 Device</h3>
            <p className="text-sm text-gray-600">Demo Mode - Coming Soon</p>
          </div>
        </div>
        
        {connected ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-600 font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500 font-medium">Not Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Device Info */}
      {deviceInfo && !connected && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <p className="font-medium">Device ID: {deviceInfo.device_id}</p>
          <p className="text-xs mt-1">{deviceInfo.message}</p>
        </div>
      )}

      {/* Connection Instructions */}
      {showInstructions && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <h4 className="font-semibold text-amber-900 mb-2">Setup Instructions</h4>
          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
            <li>Download the ESP32 firmware from the provided link</li>
            <li>Flash the firmware to your ESP32 board using Arduino IDE</li>
            <li>Power on the ESP32 device</li>
            <li>Scan for Bluetooth devices in your mobile app</li>
            <li>Select "CareSyncVision-ESP32" from available devices</li>
            <li>Enter the pairing code: <span className="font-mono bg-white px-2 py-1 rounded">123456</span></li>
            <li>Grant permissions for health sensor access</li>
            <li>Wait for data synchronization to complete</li>
          </ol>
          
          <div className="mt-4 space-y-2">
            <a
              href="https://github.com/adityasinha1002/CareSyncVision/tree/main/ESP32_Main"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2 bg-amber-600 text-white rounded text-sm font-medium hover:bg-amber-700 transition"
            >
              Download ESP32 Firmware
            </a>
            <a
              href="/docs/esp32-setup"
              className="block text-center px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded text-sm font-medium hover:bg-amber-50 transition"
            >
              View Complete Setup Guide
            </a>
          </div>
        </div>
      )}

      {/* Status Details */}
      {deviceInfo && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-white rounded p-2 border border-gray-100">
            <p className="text-xs text-gray-500">Battery Level</p>
            <p className="font-semibold text-gray-800">{deviceInfo.battery_level}%</p>
          </div>
          <div className="bg-white rounded p-2 border border-gray-100">
            <p className="text-xs text-gray-500">Signal Strength</p>
            <p className="font-semibold text-gray-800">{deviceInfo.signal_strength}%</p>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Connecting...' : 'Connect Device'}
            </button>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded font-medium hover:bg-blue-50 transition"
            >
              {showInstructions ? 'Hide' : 'Help'}
            </button>
          </>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Disconnecting...' : 'Disconnect Device'}
          </button>
        )}
      </div>

      {/* Demo Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        <p className="font-medium">⚡ Demo Mode Notice</p>
        <p className="mt-1">
          This is a demo version. Full Bluetooth integration with real-time health monitoring 
          will be available in Phase 2 when the mobile app is released. Currently, you can view 
          firmware setup instructions.
        </p>
      </div>
    </div>
  );
};
