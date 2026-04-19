import { useState, useEffect } from 'react';
import { Bluetooth, AlertCircle, CheckCircle, Wifi, WifiOff, Battery, Radio } from 'lucide-react';
import { espDeviceService } from '../services/api';

export const ESPDeviceDemo = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const response = await espDeviceService.getStatus();
      setConnected(response.data.connected);
      setDeviceInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch device status:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true); setError(null);
    try {
      const response = await espDeviceService.connect(`ESP32-${Date.now()}`);
      if (response.status >= 200 && response.status < 300) {
        setShowInstructions(true);
      } else {
        setError(response.data.error || 'Failed to connect device');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await espDeviceService.disconnect();
      setConnected(false); setShowInstructions(false); setDeviceInfo(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: '#9f1211' }} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fdf2f2' }}>
              <Bluetooth className="w-4 h-4" style={{ color: '#9f1211' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">ESP32 Device</h3>
              <p className="text-xs text-gray-400">Demo Mode · Phase 2</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            connected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Connected' : 'Offline'}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9f1211' }} />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Device stats */}
        {deviceInfo && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Battery className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400">Battery</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{deviceInfo.battery_level || '--'}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Radio className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400">Signal</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{deviceInfo.signal_strength || '--'}%</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {showInstructions && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-sm font-bold text-amber-900 mb-2">Setup Instructions</h4>
            <ol className="text-xs text-amber-800 space-y-1.5 list-decimal list-inside">
              {[
                'Flash firmware to ESP32 using Arduino IDE',
                'Power on the ESP32 device',
                'Select "CareSyncVision-ESP32" via Bluetooth',
                'Enter pairing code: 123456',
                'Grant health sensor permissions',
              ].map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            <a
              href="https://github.com/adityasinha1002/CareSyncVision/tree/main/ESP32_Main"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
              style={{ color: '#9f1211' }}
            >
              Download Firmware →
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!connected ? (
            <>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex-1 btn-primary py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading ? 'Connecting...' : 'Connect Device'}
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="btn-outline py-2 px-4 text-sm"
              >
                {showInstructions ? 'Hide' : 'Help'}
              </button>
            </>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>

        {/* Demo notice */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Demo Mode:</span> Full Bluetooth integration
            with real-time health monitoring coming in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
};

