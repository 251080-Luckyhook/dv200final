import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VolunteerHome from './pages/VolunteerHome.jsx';
import BookSession from './pages/BookSession.jsx';
import MyVisits from './pages/MyVisits.jsx';
import StaffHome from './pages/StaffHome.jsx';
import VisualCalendar from './pages/VisualCalendar.jsx';
import ShiftBoard from './pages/ShiftBoard.jsx';
import ReportingHub from './pages/ReportingHub.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function RequireAuth({ staffOnly, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="page-loading">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (staffOnly && !user.isStaff) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function RedirectHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="page-loading">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return <Navigate to={user.isStaff ? '/staff' : '/home'} replace />;
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const previousIsStaff = useRef(null);

  useEffect(() => {
    const isStaff = user ? user.isStaff : null;

    if (previousIsStaff.current !== null && isStaff !== null && previousIsStaff.current !== isStaff) {
      navigate(isStaff ? '/staff' : '/home', { replace: true });
    }

    previousIsStaff.current = isStaff;
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/" element={<RedirectHome />} />

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<VolunteerHome />} />

        <Route path="/my-visits" element={<MyVisits />} />

        <Route path="/bookings" element={<BookSession />} />

        <Route path="/account" element={<SettingsPage initialTab="security" />} />
      </Route>

      <Route
        element={
          <RequireAuth staffOnly>
            <Layout staff />
          </RequireAuth>
        }
      >
        <Route path="/staff" element={<StaffHome />} />

        <Route path="/staff/bookings" element={<VisualCalendar />} />

        <Route path="/staff/volunteers" element={<ShiftBoard />} />

        <Route path="/staff/reports" element={<ReportingHub />} />

        <Route path="/staff/account" element={<SettingsPage staff initialTab="security" />} />

        <Route path="/staff/settings" element={<SettingsPage staff initialTab="general" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
