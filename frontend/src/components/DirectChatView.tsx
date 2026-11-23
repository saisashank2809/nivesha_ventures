import React, { useState, useEffect, useRef } from 'react';
import { Connection, Message, User } from '../shared/types';
import { Api } from '../shared/api';
import { formatDate } from '../shared/formatters';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await Api.getConnections();
      setConnections(data);

      if (data.length > 0 && !activeConnectionId) {
        // Select first connected one, or first one
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
      loadMessages(activeConnectionId);
      const interval = setInterval(() => {
        loadMessages(activeConnectionId);
      }, 4000); // Polling every 4s for fresh messages
      return () => clearInterval(interval);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConn = connections.find((c) => c.id === activeConnectionId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConnectionId || sending) return;

    try {
      setSending(true);
      const newMsg = await Api.sendMessage(activeConnectionId, inputContent.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInputContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
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

  const isConnected = activeConn?.status === 'CONNECTED';
  const otherPartyName =
    currentUser.role === 'INVESTOR'
      ? activeConn?.company_name
      : `${activeConn?.investor_name} (${activeConn?.investor_firm || 'Investor'})`;

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            margin: '0 0 4px 0',
            fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
            fontSize: '28px',
            color: '#121a29',
            fontWeight: 400,
          }}
        >
          Direct Messaging & Introductions
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#4c5262' }}>
          Secure, direct 1-on-1 communication between verified founders and connected investors.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          boxShadow: '0 20px 40px -20px rgba(12, 24, 38, 0.15)',
          minHeight: '620px',
          maxHeight: '750px',
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar: Connection Threads */}
        <div
          style={{
            borderRight: '1px solid #e3d6bf',
            backgroundColor: '#fbf8f2',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #e3d6bf', fontWeight: 600, fontSize: '13px', color: '#7a5c2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Connections ({connections.length})
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {connections.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                No connection requests yet.
                {onNavigateToDirectory && (
                  <button
                    onClick={onNavigateToDirectory}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      backgroundColor: '#121a29',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Ventures
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
                      backgroundColor: isSelected ? '#fffdf9' : 'transparent',
                      borderLeft: isSelected ? '3px solid #7a5c2e' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#121a29' }}>
                        {displayName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          backgroundColor: c.status === 'CONNECTED' ? '#0c1826' : '#f5efe5',
                          color: c.status === 'CONNECTED' ? '#f5efe5' : '#7a5c2e',
                          border: '1px solid #d6c9b2',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#4c5262' }}>{subText}</div>

                    {/* Show Consent Button if pending founder consent */}
                    {currentUser.role === 'FOUNDER' && c.status === 'REQUESTED' && !c.founder_consent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGrantConsent(c.id);
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '4px 10px',
                          backgroundColor: '#0c1826',
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Accept & Unlock Chat
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {activeConn ? (
            <>
              {/* Chat Header Bar */}
              <div
                style={{
                  padding: '14px 24px',
                  borderBottom: '1px solid #e3d6bf',
                  backgroundColor: '#fffdf9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                      fontSize: '20px',
                      color: '#121a29',
                      fontWeight: 500,
                    }}
                  >
                    {otherPartyName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#7a5c2e', marginTop: '2px' }}>
                    {isConnected ? '✓ Connected Introduction' : 'Awaiting mutual consent'}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#4c5262' }}>
                  Reference: <code style={{ backgroundColor: '#f5efe5', padding: '2px 4px' }}>{activeConn.id.slice(0, 12)}</code>
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
                  backgroundColor: '#faf9f5',
                }}
              >
                {!isConnected ? (
                  <div
                    style={{
                      backgroundColor: '#fffdf9',
                      border: '1px dashed #7a5c2e',
                      padding: '24px',
                      textAlign: 'center',
                      margin: 'auto 0',
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#121a29', marginBottom: '8px' }}>
                      Connection In Progress
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4c5262', maxWidth: '440px', lineHeight: 1.6 }}>
                      Direct messaging unlocks once both parties confirm consent.
                      {currentUser.role === 'FOUNDER' && !activeConn.founder_consent && (
                        <div style={{ marginTop: '16px' }}>
                          <button
                            onClick={() => handleGrantConsent(activeConn.id)}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#0c1826',
                              color: '#fff',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Grant Founder Consent & Start Messaging
                          </button>
                        </div>
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span style={{ fontSize: '11px', color: '#8a8070', backgroundColor: '#f5efe5', padding: '4px 10px', borderRadius: '4px' }}>
                        Simulated Introduction Established · Messages are private to you and the counterpart
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
                              color: '#7a5c2e',
                              marginBottom: '3px',
                              fontWeight: 500,
                            }}
                          >
                            {isMe ? 'You' : m.sender_name}
                          </div>
                          <div
                            style={{
                              maxWidth: '70%',
                              padding: '12px 16px',
                              backgroundColor: isMe ? '#0c1826' : '#fffdf9',
                              color: isMe ? '#f5efe5' : '#121a29',
                              border: isMe ? 'none' : '1px solid #d6c9b2',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              fontSize: '14px',
                              lineHeight: 1.5,
                            }}
                          >
                            {m.content}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                            {formatDate(m.timestamp)}
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
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e3d6bf', backgroundColor: '#fffdf9' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Type a message or discuss diligence details..."
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        border: '1px solid #8a8070',
                        fontSize: '14px',
                        backgroundColor: '#fffdf9',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputContent.trim()}
                      style={{
                        padding: '0 20px',
                        backgroundColor: '#0c1826',
                        color: '#f5efe5',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: sending || !inputContent.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', margin: 'auto' }}>
              Select a conversation from the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
