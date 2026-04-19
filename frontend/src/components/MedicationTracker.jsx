import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Minimal, modern MedicationTracker component
const mockMedications = [
  { id: 1, name: 'Aspirin', dosage: '100mg', scheduled_time: '08:00', adherence_status: 'taken' },
  { id: 2, name: 'Metformin', dosage: '500mg', scheduled_time: '12:00', adherence_status: 'missed' },
  { id: 3, name: 'Atorvastatin', dosage: '20mg', scheduled_time: '20:00', adherence_status: 'pending' },
];

export default function MedicationTracker() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    // Replace with real API call
    setMedications(mockMedications);
  }, []);

  const handleMedicationTaken = (id) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setMedications((prev) =>
        prev.map((med) =>
          med.id === id ? { ...med, adherence_status: 'taken' } : med
        )
      );
      setLoading((prev) => ({ ...prev, [id]: false }));
    }, 1000);
  };

  return (
    <div className="dashboard-card border-primary">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
        <Clock className="w-5 h-5 text-primary" /> Medication Tracker
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">{error}</div>
      )}
      {medications.length === 0 ? (
        <div className="text-gray-400">No medications scheduled.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {medications.map((med) => {
            const isTaken = med.adherence_status === 'taken';
            const isMissed = med.adherence_status === 'missed';
            return (
              <li key={med.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-primary">{med.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{med.dosage} • {med.scheduled_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isTaken ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Taken
                    </span>
                  ) : isMissed ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Missed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMedicationTaken(med.id)}
                      disabled={loading[med.id]}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      {loading[med.id] ? 'Recording...' : 'Pending'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
