import React from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenLogin: (role?: UserRole, isRegister?: boolean) => void;
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

        {/* Center Nav Links - Contextual by User Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Unauthenticated / Investor / Reviewer can explore opportunities */}
          {(!currentUser || currentUser.role === 'INVESTOR' || currentUser.role === 'REVIEWER') && (
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
              {currentUser?.role === 'INVESTOR' ? 'Venture Matches & Mandate' : 'Verified Opportunities'}
            </button>
          )}

          {/* Founder specific views */}
          {currentUser?.role === 'FOUNDER' && (
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
              My Venture Story
            </button>
          )}

          {/* Reviewer / Operator specific views */}
          {currentUser?.role === 'REVIEWER' && (
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
          )}

          {/* Authenticated Messaging */}
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

        {/* Right: Authenticated User Profile & Real Sign In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#121a29' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '11px', color: '#7a5c2e', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#15803d',
                    }}
                  />
                  {currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}
                  {currentUser.firm_or_company ? ` • ${currentUser.firm_or_company}` : ''}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #d6c9b2',
                  fontSize: '12px',
                  color: '#4c5262',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenLogin('INVESTOR', false)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #8a8070',
                  color: '#121a29',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenLogin('FOUNDER', true)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Join Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
