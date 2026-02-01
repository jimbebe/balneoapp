import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Calendar, Users, Monitor, RotateCcw, Play } from 'lucide-react';
import { useActiveSession } from '../context/ActiveSessionContext';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionActive, slots } = useActiveSession();

  const resetData = () => {
    if (confirm('Réinitialiser toutes les données avec les exemples ?')) {
      localStorage.removeItem('balneo-app-data');
      window.location.reload();
    }
  };

  const activeCount = slots.filter(s => !s.isComplete).length;
  const isOnDisplayPage = location.pathname === '/display';

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="logo">
          <h1>ForméO</h1>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/exercises" className={({ isActive }) => isActive ? 'active' : ''}>
              <Dumbbell size={20} />
              <span>Exercices</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/sessions" className={({ isActive }) => isActive ? 'active' : ''}>
              <Calendar size={20} />
              <span>Sessions</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/patients" className={({ isActive }) => isActive ? 'active' : ''}>
              <Users size={20} />
              <span>Patients</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/display" className={({ isActive }) => isActive ? 'active' : ''}>
              <Monitor size={20} />
              <span>Affichage</span>
              {isSessionActive && <span className="session-badge">{activeCount}</span>}
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button className="reset-btn" onClick={resetData}>
            <RotateCcw size={16} />
            <span>Réinitialiser</span>
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>

      {isSessionActive && !isOnDisplayPage && (
        <button className="floating-session-btn" onClick={() => navigate('/display')}>
          <Play size={20} />
          <span>Session en cours ({activeCount})</span>
        </button>
      )}
    </div>
  );
}
