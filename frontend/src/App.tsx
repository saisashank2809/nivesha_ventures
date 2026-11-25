import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, VentureCard as IVentureCard, VentureDetail } from './shared/types';
import { Api } from './shared/api';
import { playNotificationChime, showInternetNotification } from './shared/notifications';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { VentureDetailModal } from './components/VentureDetailModal';
import { DirectChatView } from './components/DirectChatView';
import { ChatbotWidget } from './components/ChatbotWidget';
import { LandingPageView } from './features/landing/LandingPageView';
import { InvestorGuidedDiscovery } from './features/investor/InvestorGuidedDiscovery';
import { FounderGuidedJourney } from './features/founder/FounderGuidedJourney';
import { FounderDashboard } from './features/founder/FounderDashboard';
import { PlatformReviewView } from './features/platform/PlatformReviewView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(Api.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const user = Api.getCurrentUser();
    if (user?.role === 'INVESTOR') return 'INVESTOR_DISCOVERY';
    return 'LANDING';
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalRole, setLoginModalRole] = useState<UserRole>('INVESTOR');
  const [loginModalIsRegister, setLoginModalIsRegister] = useState(false);

  const [ventures, setVentures] = useState<IVentureCard[]>([]);
  const [selectedVentureDetail, setSelectedVentureDetail] = useState<VentureDetail | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeChatConnectionId, setActiveChatConnectionId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Check and verify authentic session on startup
  useEffect(() => {
    const token = Api.getToken();
    if (token) {
      Api.getMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          // Token expired or invalid
          Api.logout();
          setCurrentUser(null);
        });
    }
  }, []);

  // Load ventures and calculate unread / pending items
  const loadData = useCallback(async () => {
    try {
      const data = await Api.getVentures();
      setVentures(data);

      if (Api.getToken()) {
        try {
          const connections = await Api.getConnections();
          if (currentUser?.role === 'FOUNDER') {
            const pendingReqs = connections.filter(
              (c) => c.status === 'REQUESTED' && !c.founder_consent
            ).length;
            setUnreadCount(pendingReqs);
          } else if (currentUser?.role === 'INVESTOR') {
            const newlyConnected = connections.filter(
              (c) => c.status === 'CONNECTED'
            ).length;
            setUnreadCount(newlyConnected);
          }
        } catch {
          // not logged in or invalid token
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global background internet notification sync
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser || !Api.getToken()) return;

    const checkIncomingNotifications = async () => {
      try {
        const unreadMsgs = await Api.getUnreadMessages();
        setUnreadCount(unreadMsgs.length);

        if (unreadMsgs.length > 0) {
          unreadMsgs.forEach((msg) => {
            if (!seenMsgIdsRef.current.has(msg.id)) {
              seenMsgIdsRef.current.add(msg.id);
              // Trigger desktop internet notification + audio chime
              playNotificationChime();
              showInternetNotification(`💬 New message from ${msg.sender_name}`, {
                body: msg.content,
                onClick: () => {
                  setActiveChatConnectionId(msg.connection_id);
                  setActiveTab('MESSAGES');
                },
              });
              showToast(`💬 Direct text from ${msg.sender_name}: "${msg.content.slice(0, 45)}${msg.content.length > 45 ? '...' : ''}"`);
            }
          });
        }
      } catch (err) {
        // network or background error
      }
    };

    checkIncomingNotifications();
    const interval = setInterval(checkIncomingNotifications, 3500);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Open full detail modal
  const handleSelectVenture = async (venture: IVentureCard | string) => {
    const id = typeof venture === 'string' ? venture : venture.id;
    try {
      const detail = await Api.getVentureDetail(id);
      setSelectedVentureDetail(detail);
      setDetailModalOpen(true);
    } catch (err: any) {
      showToast(`Error opening venture detail: ${err.message}`);
    }
  };

  // Investor directly messaging founder
  const handleRequestConnection = async (ventureId: string, note?: string) => {
    if (!currentUser) {
      setLoginModalRole('INVESTOR');
      setLoginModalIsRegister(false);
      setLoginModalOpen(true);
      return;
    }
    try {
      const conn = await Api.requestConnection(ventureId, note);
      showToast('Direct message sent! 1-on-1 direct chat channel opened.');
      setDetailModalOpen(false);
      await loadData();
      handleOpenChat(conn.id);
    } catch (err: any) {
      showToast(`Direct message failed: ${err.message}`);
    }
  };

  // Open Direct Chat
  const handleOpenChat = (connectionId: string) => {
    setActiveChatConnectionId(connectionId);
    setActiveTab('MESSAGES');
    setDetailModalOpen(false);
  };

  // Handle Login Modal
  const handleOpenLogin = (role: UserRole = 'INVESTOR', isRegister: boolean = false) => {
    setLoginModalRole(role);
    setLoginModalIsRegister(isRegister);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.full_name} (${user.role})!`);
    loadData();
    if (user.role === 'INVESTOR') {
      setActiveTab('INVESTOR_DISCOVERY');
    } else if (user.role === 'FOUNDER') {
      setActiveTab('FOUNDER_DASHBOARD');
    } else if (user.role === 'REVIEWER') {
      setActiveTab('PLATFORM_REVIEW');
    }
  };

  const handleUserChanged = (user: User | null) => {
    setCurrentUser(user);
    loadData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            background: 'var(--bg-dark)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            fontSize: '13.5px',
            fontWeight: 500,
            borderLeft: '4px solid var(--accent-gold)',
            animation: 'fadeIn 0.2s ease',
            maxWidth: '420px',
          }}
        >
          {notification}
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLogin={handleOpenLogin}
        onUserChanged={handleUserChanged}
        unreadCount={unreadCount}
      />

      {/* Main View Switcher */}
      <main style={{ flex: 1 }}>
        {activeTab === 'LANDING' && (
          <LandingPageView
            ventures={ventures}
            currentUser={currentUser}
            onExploreVentures={() => setActiveTab('INVESTOR_DISCOVERY')}
            onStartOnboarding={() => {
              if (currentUser?.role === 'FOUNDER') {
                setActiveTab('FOUNDER_JOURNEY');
              } else {
                handleOpenLogin('FOUNDER', true);
              }
            }}
            onOpenLogin={() => handleOpenLogin('INVESTOR', false)}
            onSelectVenture={handleSelectVenture}
            onNavigateToDashboard={() => {
              if (currentUser?.role === 'FOUNDER') setActiveTab('FOUNDER_DASHBOARD');
              else if (currentUser?.role === 'INVESTOR') setActiveTab('INVESTOR_DISCOVERY');
              else if (currentUser?.role === 'REVIEWER') setActiveTab('PLATFORM_REVIEW');
            }}
          />
        )}

        {(activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY') && (
          <InvestorGuidedDiscovery
            currentUser={currentUser}
            onOpenLogin={() => handleOpenLogin('INVESTOR', false)}
            onOpenDirectChat={handleOpenChat}
            onSelectVenture={handleSelectVenture}
          />
        )}

        {(activeTab === 'FOUNDER_DASHBOARD' || activeTab === 'FOUNDER_PORTAL') && (
          <FounderDashboard
            currentUser={currentUser}
            onOpenBuilder={() => setActiveTab('FOUNDER_JOURNEY')}
            onOpenChat={handleOpenChat}
            onOpenLogin={() => handleOpenLogin('FOUNDER', false)}
            onSelectVenture={handleSelectVenture}
          />
        )}

        {(activeTab === 'FOUNDER_JOURNEY' || activeTab === 'ONBOARDING') && (
          <FounderGuidedJourney
            currentUser={currentUser}
            onComplete={() => {
              showToast('Venture profile and story saved successfully!');
              setActiveTab('FOUNDER_DASHBOARD');
            }}
            onCancel={() => setActiveTab('FOUNDER_DASHBOARD')}
            onOpenLogin={() => handleOpenLogin('FOUNDER', false)}
          />
        )}

        {activeTab === 'PLATFORM_REVIEW' && (
          <PlatformReviewView
            currentUser={currentUser}
            onOpenLogin={() => handleOpenLogin('REVIEWER', false)}
            onSelectVenture={handleSelectVenture}
          />
        )}

        {activeTab === 'MESSAGES' && (
          currentUser ? (
            <DirectChatView
              currentUser={currentUser}
              initialConnectionId={activeChatConnectionId}
              onNavigateToDirectory={() => setActiveTab('INVESTOR_DISCOVERY')}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: '24px', color: '#121a29' }}>
                Sign in to view direct messages
              </h2>
              <p style={{ color: '#4c5262', fontSize: '14px', margin: '8px 0 20px' }}>
                Direct communication is unlocked once introductions are reviewed and approved.
              </p>
              <button
                onClick={() => handleOpenLogin('INVESTOR', false)}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: '#0c1826',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          )
        )}
      </main>

      {/* Diligence Report Modal */}
      <VentureDetailModal
        venture={selectedVentureDetail}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onRequestConnection={handleRequestConnection}
        onOpenChat={handleOpenChat}
      />

      {/* Authentication Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        initialRole={loginModalRole}
        initialIsRegister={loginModalIsRegister}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Floating AI Assistant Chatbot Widget */}
      <ChatbotWidget
        currentUser={currentUser}
        onSelectVenture={(id) => handleSelectVenture(id)}
      />
    </div>
  );
}

export default App;
