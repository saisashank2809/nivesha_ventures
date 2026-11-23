import React, { useState, useRef, useEffect } from 'react';
import { User, AIChatMessage } from '../shared/types';
import { Api } from '../shared/api';

interface ChatbotWidgetProps {
  currentUser: User | null;
  onSelectVenture?: (ventureId: string) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ currentUser, onSelectVenture }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        currentUser?.role === 'FOUNDER'
          ? `Welcome to Nivesha! I am your Founder Co-pilot. I can help you prepare your showcase, refine your elevator pitch, and prepare your diligence evidence for investors.`
          : `Hello! I am your Nivesha Diligence Assistant. I can help you find verified Indian ventures, inspect diligence findings, and check fit against your mandate.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>(
    currentUser?.role === 'FOUNDER'
      ? ['Refine Venture Showcase', 'Review Capital Structure', 'Check Diligence Readiness']
      : ['Show Verified FinTechs', 'Compare Ticket Ranges', 'Check Mandate Overlap']
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const context = currentUser?.role === 'FOUNDER' ? 'FOUNDER' : 'INVESTOR';
      const res = await Api.sendAIChat(textToSend, context, undefined, messages);

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.suggested_actions && res.suggested_actions.length > 0) {
        setSuggestedActions(res.suggested_actions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Apologies, I encountered an error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 900 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            backgroundColor: '#0c1826',
            color: '#f5efe5',
            border: '1px solid #7a5c2e',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(12, 24, 38, 0.25)',
            cursor: 'pointer',
            fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '18px' }}>✨</span>
          <span>{currentUser?.role === 'FOUNDER' ? 'Founder Co-pilot' : 'AI Diligence Assistant'}</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '520px',
            backgroundColor: '#fffdf9',
            border: '1px solid #d6c9b2',
            boxShadow: '0 20px 48px -10px rgba(12, 24, 38, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#0c1826',
              color: '#f5efe5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                  fontSize: '17px',
                  fontWeight: 500,
                }}
              >
                {currentUser?.role === 'FOUNDER' ? 'Nivesha Founder Co-pilot' : 'Nivesha Diligence Assistant'}
              </div>
              <div style={{ fontSize: '11px', color: '#b39463' }}>
                Powered by Nivesha Diligence Knowledge Base
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#faf9f5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    backgroundColor: isAssistant ? '#fffdf9' : '#0c1826',
                    color: isAssistant ? '#121a29' : '#f5efe5',
                    border: isAssistant ? '1px solid #d6c9b2' : 'none',
                    padding: '10px 14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  }}
                >
                  {m.content}
                </div>
              );
            })}
            {loading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#7a5c2e', fontStyle: 'italic' }}>
                Analyzing diligence data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {suggestedActions.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#f5efe5',
                borderTop: '1px solid #e3d6bf',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    backgroundColor: '#fffdf9',
                    border: '1px solid #b39463',
                    color: '#7a5c2e',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div style={{ padding: '12px', borderTop: '1px solid #e3d6bf', backgroundColor: '#fffdf9' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                placeholder="Ask about ventures, diligence, or pitches..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #8a8070',
                  fontSize: '13px',
                  background: '#fffdf9',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: '0 14px',
                  backgroundColor: '#0c1826',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
