import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './hooks/useStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { HealthInput } from './pages/HealthInput';

function AppContent() {
  const { isAuthenticated, initialize, setAuth } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize authentication state from localStorage and URL params
  useEffect(() => {
    // Check for OAuth redirect params (from backend after Google redirects back)
    const token = searchParams.get('token');
    const patientId = searchParams.get('patient_id');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const isOAuth = searchParams.get('oauth');

    if (token && patientId && isOAuth) {
      // OAuth redirect - store token and user data
      console.log('Processing OAuth redirect with token');
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('patientId', patientId);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);
      
      setAuth({
        user: { patient_id: patientId, email, name },
        token
      });

      // Clean up URL params
      window.history.replaceState({}, document.title, '/dashboard');
    } else {
      // Normal initialization from localStorage
      initialize();
    }
  }, [initialize, setAuth, searchParams]);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/health-input"
        element={isAuthenticated ? <HealthInput /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
