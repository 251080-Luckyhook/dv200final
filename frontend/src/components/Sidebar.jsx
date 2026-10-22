import { NavLink, Link } from 'react-router-dom';
import { BarChart3, CalendarDays, Home, LogOut, Settings, User, Users, LayoutDashboard } from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';

function Item({ to, icon: Icon, children, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <Icon size={20} strokeWidth={1.6} />

      <span>{children}</span>
    </NavLink>
  );
}

export default function Sidebar({ staff }) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <Link to={staff ? '/staff' : '/home'} className="logo" aria-label="Ngwana Huis home">
        <img
          src="/logo-1.png"
          alt="Ngwana Huis — Huis vir verlate babas / House for abandoned babies"
        />
      </Link>

      <nav className="nav">
        {staff ? (
          <>
            <Item to="/staff/volunteers" icon={Users}>
              Volunteers
            </Item>

            <Item to="/staff" icon={Home} end>
              Home
            </Item>

            <Item to="/staff/bookings" icon={CalendarDays}>
              Bookings
            </Item>

            <Item to="/staff/reports" icon={BarChart3}>
              Reports
            </Item>

            <hr />

            <Item to="/staff/account" icon={User}>
              Account
            </Item>

            <Item to="/staff/settings" icon={Settings}>
              Settings
            </Item>
          </>
        ) : (
          <>
            <Item to="/home" icon={Home}>
              Home
            </Item>

            <Item to="/my-visits" icon={BarChart3}>
              My visits
            </Item>

            <Item to="/bookings" icon={CalendarDays}>
              Bookings
            </Item>

            <hr />

            <Item to="/account" icon={User}>
              Account
            </Item>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        {staff ? (
          <Link to="/home" className="nav-item muted">
            <LogOut size={20} strokeWidth={1.6} />

            <span>View volunteer dashboard</span>
          </Link>
        ) : (
          user && user.isStaff && (
            <Link to="/staff" className="nav-item muted">
              <LayoutDashboard size={20} strokeWidth={1.6} />

              <span>Back to staff dashboard</span>
            </Link>
          )
        )}

        <button type="button" className="nav-item muted as-button" onClick={logout}>
          <LogOut size={20} strokeWidth={1.6} />

          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
