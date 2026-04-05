import { useEffect, useState } from 'react';
import { patientService } from '../services/api';

export const usePatientData = (patientId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await patientService.getPatientData(patientId);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  return { data, loading, error };
};

export const useMedicationSchedule = (patientId) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await medicationService.getMedicationSchedule(patientId);
        setSchedule(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchSchedule();
    }
  }, [patientId]);

  return { schedule, loading, error };
};
