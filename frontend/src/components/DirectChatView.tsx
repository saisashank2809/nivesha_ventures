import React, { useState, useEffect, useRef } from 'react';
import { Connection, Message, User } from '../shared/types';
import { Api } from '../shared/api';
import { formatDate } from '../shared/formatters';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showInternetNotification,
  playNotificationChime,
} from '../shared/notifications';

interface DirectChatViewProps {
  currentUser: User;
  initialConnectionId?: string | null;
  onNavigateToDirectory?: () => void;
}

export const DirectChatView: React.FC<DirectChatViewProps> = ({
  currentUser,
  initialConnectionId,
  onNavigateToDirectory,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(initialConnectionId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageIdsRef = useRef<Set<string>>(new Set());

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await Api.getConnections();
      setConnections(data);

      if (data.length > 0 && !activeConnectionId) {
        const connected = data.find((c) => c.status === 'CONNECTED') || data[0];
        setActiveConnectionId(connected.id);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (connId: string) => {
    try {
      const msgs = await Api.getMessages(connId);

      // Check if new incoming messages arrived
      if (previousMessageIdsRef.current.size > 0) {
        const newIncoming = msgs.filter(
          (m) => !previousMessageIdsRef.current.has(m.id) && m.sender_id !== currentUser.id
        );

        if (newIncoming.length > 0) {
          const newest = newIncoming[newIncoming.length - 1];
          playNotificationChime();
          showInternetNotification(`💬 New message from ${newest.sender_name}`, {
            body: newest.content,
          });
        }
      }

      // Update seen IDs
      const newSet = new Set<string>();
      msgs.forEach((m) => newSet.add(m.id));
      previousMessageIdsRef.current = newSet;

      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [currentUser]);

  useEffect(() => {
    if (activeConnectionId) {
      previousMessageIdsRef.current = new Set();
      loadMessages(activeConnectionId);
      const interval = setInterval(() => {
        loadMessages(activeConnectionId);
      }, 3000); // 3-second live sync over internet
      return () => clearInterval(interval);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConn = connections.find((c) => c.id === activeConnectionId);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeConnectionId || sending) return;

    try {
      setSending(true);
      const text = inputContent.trim();
      setInputContent('');
      const newMsg = await Api.sendMessage(activeConnectionId, text);
      setMessages((prev) => [...prev, newMsg]);
      previousMessageIdsRef.current.add(newMsg.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGrantConsent = async (connId: string) => {
    try {
      const updated = await Api.submitConsent(connId, true);
      setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (activeConnectionId === connId) {
        loadMessages(connId);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      playNotificationChime();
      showInternetNotification('🔔 Notifications Enabled!', {
        body: 'You will now receive real-time alerts over the internet when new messages arrive.',
      });
      setTestAlertSuccess('Desktop & internet notifications are now active!');
      setTimeout(() => setTestAlertSuccess(null), 4000);
    }
  };

  const handleTestAlert = () => {
    playNotificationChime();
    showInternetNotification('💬 Nivesha Test Alert', {
      body: 'Notifications are working! You will receive messages even when another tab is active.',
    });
    setTestAlertSuccess('Test notification sent & chime played!');
    setTimeout(() => setTestAlertSuccess(null), 3000);
  };

  const isConnected = activeConn?.status === 'CONNECTED';
  const otherPartyName =
    currentUser.role === 'INVESTOR'
      ? activeConn?.company_name
      : `${activeConn?.investor_name} (${activeConn?.investor_firm || 'Investor'})`;

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '24px 20px 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header and Internet Notification Banner */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2
            style={{
              margin: '0 0 4px 0',
              fontFamily: "var(--font-sans)",
              fontSize: '28px',
              color: '#0f172a',
              fontWeight: 500,
            }}
          >
            Direct 1-on-1 Messaging
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#4c5262' }}>
            Instant direct communication between verified founders and connected investors.
          </p>
        </div>

        {/* Internet Notification Status Widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803d', backgroundColor: '#eef7f0', padding: '6px 12px', borderRadius: '20px', border: '1px solid #bce2c4' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d', display: 'inline-block' }}></span>
            <span>Live Internet Sync (3s)</span>
          </div>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#0f172a',
                color: '#f5f5f7',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span>🔔</span>
              <span>Enable Internet Notifications</span>
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#f5f5f7',
                color: '#0066cc',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
              title="Test notification alert and chime"
            >
              <span>🔔</span>
              <span>Notifications Active · Test Alert</span>
            </button>
          )}
        </div>
      </div>

      {testAlertSuccess && (
        <div style={{ marginBottom: '16px', padding: '10px 16px', backgroundColor: '#edf5ee', color: '#15803d', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #bce2c4' }}>
          ✓ {testAlertSuccess}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 12px 30px rgba(12, 24, 38, 0.08)',
          minHeight: '640px',
          maxHeight: '760px',
          overflow: 'hidden',
          borderRadius: '10px',
        }}
      >
        {/* Left Sidebar: Connection Threads */}
        <div
          style={{
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: '#fbfbfd',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', fontWeight: 700, fontSize: '12px', color: '#0066cc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Direct Conversations ({connections.length})
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {connections.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                No direct messages yet.
                {onNavigateToDirectory && (
                  <button
                    onClick={onNavigateToDirectory}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Ventures & Message
                  </button>
                )}
              </div>
            ) : (
              connections.map((c) => {
                const isSelected = c.id === activeConnectionId;
                const displayName = currentUser.role === 'INVESTOR' ? c.company_name : c.investor_name;
                const subText = currentUser.role === 'INVESTOR' ? 'Venture' : c.investor_firm || 'Investor';

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConnectionId(c.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #ece3d4',
                      backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      borderLeft: isSelected ? '4px solid #0066cc' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                        {displayName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: c.status === 'CONNECTED' ? '#0f172a' : '#f5f5f7',
                          color: c.status === 'CONNECTED' ? '#f5f5f7' : '#0066cc',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {c.status === 'CONNECTED' ? 'DIRECT DM' : c.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#687282' }}>{subText}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff' }}>
          {activeConn ? (
            <>
              {/* Chat Header Bar */}
              <div
                style={{
                  padding: '14px 24px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-sans)",
                      fontSize: '20px',
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  >
                    {otherPartyName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
                    <span>Direct text messaging active</span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#687282' }}>
                  Channel ID: <code style={{ backgroundColor: '#f5f5f7', padding: '2px 6px', borderRadius: '3px' }}>{activeConn.id.slice(0, 12)}</code>
                </div>
              </div>

              {/* Message List */}
              <div
                style={{
                  flex: 1,
                  padding: '24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: '#f5f5f7',
                }}
              >
                {!isConnected ? (
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '16px',
                      padding: '28px',
                      textAlign: 'center',
                      margin: 'auto 0',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                      Ready to Connect
                    </div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#536074', maxWidth: '440px', lineHeight: 1.6 }}>
                      Click below to immediately unlock the direct text channel with {otherPartyName}.
                    </p>
                    <div style={{ marginTop: '16px' }}>
                      <button
                        onClick={() => handleGrantConsent(activeConn.id)}
                        style={{
                          padding: '10px 22px',
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Unlock & Start Direct Texting Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span style={{ fontSize: '11px', color: '#0066cc', backgroundColor: '#f5f5f7', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        🔒 Direct 1-on-1 Encrypted Channel · Instant Internet Notifications Enabled
                      </span>
                    </div>

                    {messages.map((m) => {
                      const isMe = m.sender_id === currentUser.id;
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#0066cc',
                              marginBottom: '3px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>{isMe ? 'You' : m.sender_name}</span>
                            <span style={{ fontSize: '9.5px', color: '#94a3b8', backgroundColor: '#f5f5f7', padding: '1px 5px', borderRadius: '3px' }}>
                              {m.sender_role}
                            </span>
                          </div>
                          <div
                            style={{
                              maxWidth: '75%',
                              padding: '12px 18px',
                              backgroundColor: isMe ? '#0f172a' : '#ffffff',
                              color: isMe ? '#f5f5f7' : '#0f172a',
                              border: isMe ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                              boxShadow: '0 2px 6px rgba(12, 24, 38, 0.05)',
                              fontSize: '14px',
                              lineHeight: 1.55,
                            }}
                          >
                            {m.content}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{formatDate(m.timestamp)}</span>
                            {isMe && <span style={{ color: '#15803d' }}>✓ Delivered</span>}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input Box */}
              {isConnected && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: '#ffffff' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder={`Direct text message to ${otherPartyName}... (Press Enter to send)`}
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid rgba(0, 0, 0, 0.16)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputContent.trim()}
                      style={{
                        padding: '0 24px',
                        backgroundColor: '#0f172a',
                        color: '#f5f5f7',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: sending || !inputContent.trim() ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>💬</span>
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', margin: 'auto' }}>
              Select a conversation from the left to start texting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
