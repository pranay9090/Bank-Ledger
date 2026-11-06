import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './DashboardLayout.css';

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-root">
      <Sidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="layout-main-wrapper">
        <Topbar
          onToggleMobileMenu={() => setMobileOpen((prev) => !prev)}
        />

        <main className="layout-content-area">
          <div className="layout-content-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

