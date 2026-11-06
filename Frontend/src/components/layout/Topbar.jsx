import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Topbar.css';

function Topbar({ onToggleMobileMenu }) {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'BL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="topbar-root">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-avatar" title={user?.name || 'Verified Client'}>
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
