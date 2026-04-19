import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Pill } from 'lucide-react';

const mockMedications = [
  { id: 1, name: 'Aspirin',       dosage: '100mg', scheduled_time: '08:00', adherence_status: 'taken'   },
  { id: 2, name: 'Metformin',     dosage: '500mg', scheduled_time: '12:00', adherence_status: 'missed'  },
  { id: 3, name: 'Atorvastatin',  dosage: '20mg',  scheduled_time: '20:00', adherence_status: 'pending' },
];

export default function MedicationTracker() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    setMedications(mockMedications);
  }, []);

  const handleMedicationTaken = (id) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setMedications(prev => prev.map(med => med.id === id ? { ...med, adherence_status: 'taken' } : med));
      setLoading(prev => ({ ...prev, [id]: false }));
    }, 1000);
  };

  const takenCount = medications.filter(m => m.adherence_status === 'taken').length;
  const total = medications.length;
  const pct = total > 0 ? Math.round((takenCount / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: '#9f1211' }} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4" style={{ color: '#9f1211' }} />
            <h2 className="text-base font-bold text-gray-900">Medication Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{takenCount}/{total} taken</span>
            <div
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: pct === 100 ? '#f0fdf4' : '#fdf2f2', color: pct === 100 ? '#16a34a' : '#9f1211' }}
            >
              {pct}%
            </div>
          </div>
        </div>

        {medications.length === 0 ? (
          <div className="py-8 text-center">
            <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No medications scheduled.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {medications.map((med) => {
              const isTaken = med.adherence_status === 'taken';
              const isMissed = med.adherence_status === 'missed';
              return (
                <li key={med.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isTaken ? '#f0fdf4' : isMissed ? '#fef2f2' : '#fdf2f2',
                      }}
                    >
                      {isTaken
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : isMissed
                        ? <AlertCircle className="w-4 h-4" style={{ color: '#9f1211' }} />
                        : <Clock className="w-4 h-4" style={{ color: '#9f1211' }} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.dosage} · {med.scheduled_time}</p>
                    </div>
                  </div>

                  <div>
                    {isTaken ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        Taken ✓
                      </span>
                    ) : isMissed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#9f1211', backgroundColor: '#fdf2f2' }}>
                        Missed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMedicationTaken(med.id)}
                        disabled={loading[med.id]}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: '#9f1211', color: '#9f1211', backgroundColor: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#9f1211'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9f1211'; }}
                      >
                        {loading[med.id] ? 'Recording...' : 'Mark Taken'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

