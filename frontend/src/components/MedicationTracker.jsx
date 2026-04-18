import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { medicationService } from '../services/api';
  return (
    <div className="dashboard-card border-primary">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
        <Pill className="w-5 h-5 text-primary" /> Medication Tracker
      </h2>
      {medications.length === 0 ? (
        <div className="text-gray-400">No medications</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {medications.map((med) => (
            <li key={med.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">{med.name}</span>
                <span className="ml-2 text-xs text-gray-500">{med.dosage}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${med.taken ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-700'}`}>
                {med.taken ? 'Taken' : 'Missed'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
