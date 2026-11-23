import React from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenLogin: (role?: UserRole) => void;
  onUserChanged: (user: User | null) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenLogin,
  onUserChanged,
  unreadCount = 0,
}) => {
  const handleDemoSwitch = async (role: UserRole) => {
    try {
      const res = await Api.switchDemo(role);
      onUserChanged(res.user);
      if (role === 'INVESTOR') {
        onNavigate('INVESTOR_DISCOVERY');
      } else if (role === 'FOUNDER') {
        onNavigate('FOUNDER_JOURNEY');
      } else if (role === 'REVIEWER') {
        onNavigate('PLATFORM_REVIEW');
      }
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    }
  };

  const handleLogout = () => {
    Api.logout();
    onUserChanged(null);
    onNavigate('LANDING');
  };

  return (
    <nav
      style={{
        backgroundColor: '#fffdf9',
        borderBottom: '1px solid #d6c9b2',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('LANDING')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#0c1826',
              color: '#f5efe5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#121a29',
                letterSpacing: '-0.01em',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
              }}
            >
              Nivesha Ventures
            </div>
            <div style={{ fontSize: '10px', color: '#7a5c2e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Capital Facilitation & Due Diligence
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onNavigate('LANDING')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeTab === 'LANDING' ? 600 : 500,
              color: activeTab === 'LANDING' ? '#0c1826' : '#4c5262',
              cursor: 'pointer',
              borderBottom: activeTab === 'LANDING' ? '2px solid #7a5c2e' : '2px solid transparent',
            }}
          >
            Overview
          </button>

          <button
            onClick={() => onNavigate('INVESTOR_DISCOVERY')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeTab === 'INVESTOR_DISCOVERY' ? 600 : 500,
              color: activeTab === 'INVESTOR_DISCOVERY' ? '#0c1826' : '#4c5262',
              cursor: 'pointer',
              borderBottom: activeTab === 'INVESTOR_DISCOVERY' ? '2px solid #7a5c2e' : '2px solid transparent',
            }}
          >
            Investor Discovery
          </button>

          <button
            onClick={() => onNavigate('FOUNDER_JOURNEY')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeTab === 'FOUNDER_JOURNEY' ? 600 : 500,
              color: activeTab === 'FOUNDER_JOURNEY' ? '#0c1826' : '#4c5262',
              cursor: 'pointer',
              borderBottom: activeTab === 'FOUNDER_JOURNEY' ? '2px solid #7a5c2e' : '2px solid transparent',
            }}
          >
            Founder Story Builder
          </button>

          <button
            onClick={() => onNavigate('PLATFORM_REVIEW')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeTab === 'PLATFORM_REVIEW' ? 600 : 500,
              color: activeTab === 'PLATFORM_REVIEW' ? '#0c1826' : '#4c5262',
              cursor: 'pointer',
              borderBottom: activeTab === 'PLATFORM_REVIEW' ? '2px solid #7a5c2e' : '2px solid transparent',
            }}
          >
            Review Desk
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('MESSAGES')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: activeTab === 'MESSAGES' ? 600 : 500,
                color: activeTab === 'MESSAGES' ? '#0c1826' : '#4c5262',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: activeTab === 'MESSAGES' ? '2px solid #7a5c2e' : '2px solid transparent',
              }}
            >
              Direct Chat
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#7a5c2e',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right: Quick Demo Persona Switcher & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Demo Switcher Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f5efe5',
              border: '1px solid #d6c9b2',
              padding: '2px',
              fontSize: '12px',
            }}
          >
            <span style={{ padding: '0 6px', color: '#7a5c2e', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
              Switch:
            </span>
            <button
              onClick={() => handleDemoSwitch('INVESTOR')}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: currentUser?.role === 'INVESTOR' ? '#0c1826' : 'transparent',
                color: currentUser?.role === 'INVESTOR' ? '#fff' : '#121a29',
                cursor: 'pointer',
                fontWeight: currentUser?.role === 'INVESTOR' ? 600 : 400,
              }}
            >
              Investor
            </button>
            <button
              onClick={() => handleDemoSwitch('FOUNDER')}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: currentUser?.role === 'FOUNDER' ? '#0c1826' : 'transparent',
                color: currentUser?.role === 'FOUNDER' ? '#fff' : '#121a29',
                cursor: 'pointer',
                fontWeight: currentUser?.role === 'FOUNDER' ? 600 : 400,
              }}
            >
              Founder
            </button>
            <button
              onClick={() => handleDemoSwitch('REVIEWER')}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: currentUser?.role === 'REVIEWER' ? '#0c1826' : 'transparent',
                color: currentUser?.role === 'REVIEWER' ? '#fff' : '#121a29',
                cursor: 'pointer',
                fontWeight: currentUser?.role === 'REVIEWER' ? 600 : 400,
              }}
            >
              Reviewer
            </button>
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#121a29' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '10.5px', color: '#7a5c2e' }}>
                  {currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #d6c9b2',
                  fontSize: '11.5px',
                  color: '#4c5262',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenLogin()}
              style={{
                padding: '6px 14px',
                backgroundColor: '#0c1826',
                color: '#fff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
