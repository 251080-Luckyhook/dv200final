import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar.jsx';

export default function Layout({ staff }) {
  return (
    <div className="app-shell">
      <Sidebar staff={staff} />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
