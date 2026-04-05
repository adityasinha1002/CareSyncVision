import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { medicationService } from '../services/api';

export const MedicationTracker = ({ medications = [], patientId }) => {
  const [meds, setMeds] = useState(medications);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const handleMedicationTaken = async (medicationId) => {
    setLoading(prev => ({ ...prev, [medicationId]: true }));
    try {
      await medicationService.recordMedication(patientId, medicationId);
      // Update local state
      setMeds(prevMeds => 
        prevMeds.map(med => 
          med.medication_id === medicationId 
            ? { ...med, adherence_status: 'taken' }
            : med
        )
      );
    } catch (err) {
      console.error('Failed to record medication:', err);
      setError('Failed to record medication. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [medicationId]: false }));
    }
  };

  if (meds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Medication Schedule</h2>
        <p className="text-gray-600">No medications scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Medication Schedule</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {meds.map((med) => {
          const isTaken = med.adherence_status === 'taken';
          const isMissed = med.adherence_status === 'missed';
          
          return (
            <div key={med.medication_id} className="flex items-center justify-between border-b pb-3">
              <div className="flex-1">
                <p className="font-semibold">{med.name || med.medication_name}</p>
                <p className="text-sm text-gray-600">
                  {med.dosage} • {med.scheduled_time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isTaken ? (
                  <button className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Taken
                  </button>
                ) : isMissed ? (
                  <button className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Missed
                  </button>
                ) : (
                  <button
                    onClick={() => handleMedicationTaken(med.medication_id)}
                    disabled={loading[med.medication_id]}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    {loading[med.medication_id] ? 'Recording...' : 'Pending'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
