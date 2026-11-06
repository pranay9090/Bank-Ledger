import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ReceiptText,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/transfer',
      label: 'Transfers',
      icon: ArrowLeftRight,
    },
    {
      to: '/transactions',
      label: 'Ledger History',
      icon: ReceiptText,
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'BL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-root ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Top Header Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">BANK LEDGER</span>
              <span className="sidebar-brand-spec">DOUBLE-ENTRY // ACID</span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">MENU</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="sidebar-active-indicator" aria-hidden="true" />
                <Icon size={18} className="sidebar-link-icon" />
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: User Identity & Sign Out */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.name || 'Verified Client'}
              </span>
              <span className="sidebar-user-email">
                {user?.email || 'client@bankledger.com'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Terminate Session"
          >
            <LogOut size={16} />
            <span>TERMINATE SESSION</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

