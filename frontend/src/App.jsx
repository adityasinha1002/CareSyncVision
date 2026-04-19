import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './hooks/useStore';

const Login      = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register   = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard  = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const HealthInput = lazy(() => import('./pages/HealthInput').then(m => ({ default: m.HealthInput })));
const Welcome    = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome ?? m.default })));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div
        className="w-10 h-10 rounded-full border-4 border-gray-100"
        style={{ borderTopColor: '#9f1211', animation: 'spin 0.8s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const { isAuthenticated, initialize } = useAuthStore();

  // Initialize authentication state from localStorage on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Suspense fallback={<Spinner />}>
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
            path="/welcome"
            element={isAuthenticated ? <Welcome /> : <Navigate to="/login" />}
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
      </Suspense>
    </Router>
  );
}

export default App;
