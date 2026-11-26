import React, { useState } from 'react';
import { User } from '../../../shared/types';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface InvestorDecisionAssistantProps {
  model: FilmVentureViewModel;
  currentUser: User | null;
  selectedUnits: number;
  onSelectUnits: (units: number) => void;
  onRequestConnection: (ventureId: string, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
  onOpenLogin: () => void;
  onOpenAppointmentModal: (suggestedTopic: string) => void;
}

export const InvestorDecisionAssistant: React.FC<InvestorDecisionAssistantProps> = ({
  model,
  currentUser,
  selectedUnits,
  onSelectUnits,
  onRequestConnection,
  onOpenChat,
  onOpenLogin,
  onOpenAppointmentModal,
}) => {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [manualNote, setManualNote] = useState('');
  const [editedManually, setEditedManually] = useState(false);

  const { venture, clarificationItems, ticketOptions, defaultEnquiryNote, selectedCapital } = model;
  const effectiveNote = editedManually ? manualNote : defaultEnquiryNote(selectedUnits, questionIdx);
  const activeCapLabel = selectedCapital ? formatINR(selectedCapital) : formatINR(model.capitalSought);

  return (
    <section id="sec-act" className="nv-story-band nv-band-white">
      <div className="nv-film-wrap">
        <span className="nv-zone-kicker">Take Your Next Step</span>
        <h2 className="nv-story-h2">Clarify Open Terms With {model.producerName}</h2>
        <p className="nv-story-sub">
          Your enquiry auto-includes your explored ticket (<strong style={{ color: 'var(--accent-blue)' }}>{activeCapLabel}</strong>). Sending a question does not commit funds.
        </p>

        <div className="nv-action-split">
          <div>
            <div className="nv-concern-grid" role="group" aria-label="Select priority question">
              {clarificationItems.map((item, idx) => (
                <button
                  key={item.short}
                  type="button"
                  aria-pressed={questionIdx === idx}
                  onClick={() => {
                    setQuestionIdx(idx);
                    setEditedManually(false);
                  }}
                  className={`nv-z4-concern-chip ${questionIdx === idx ? 'active' : ''}`}
                >
                  <strong>{item.short}</strong>
                  <span>{item.sub}</span>
                </button>
              ))}
            </div>

            <div className="nv-z4-selected-q" style={{ marginTop: '10px' }}>
              <span>Focused Question:</span> {clarificationItems[questionIdx]?.question}
            </div>
          </div>

          <div id="nv-film-enquiry-panel" className="nv-composer-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>Direct Enquiry to {model.producerName}</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>No funds committed</span>
            </div>

            {ticketOptions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {ticketOptions.map((opt) => (
                  <button
                    key={opt.units}
                    type="button"
                    onClick={() => {
                      onSelectUnits(opt.units);
                      setEditedManually(false);
                    }}
                    className={`nv-film-choice-chip ${selectedUnits === opt.units ? 'active' : ''}`}
                  >
                    {opt.amountLabel}
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={4}
              value={effectiveNote}
              onChange={(e) => {
                setManualNote(e.target.value);
                setEditedManually(true);
              }}
              aria-label={`Clarification message to ${model.producerName}`}
              className="nv-composer-textarea"
            />

            <div className="nv-z4-cta-row">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    onOpenLogin();
                    return;
                  }
                  onRequestConnection(venture.id, effectiveNote);
                }}
                className="nv-pdp-blue-btn"
              >
                <span>
                  {venture.connection_status === 'CONNECTED'
                    ? 'Send Question & Open Chat →'
                    : 'Send Clarification Question →'}
                </span>
              </button>

              {venture.connection_status === 'CONNECTED' && onOpenChat && venture.connection_id ? (
                <button
                  type="button"
                  onClick={() => onOpenChat(venture.connection_id!)}
                  className="nv-pdp-secondary-btn"
                  style={{ width: 'auto' }}
                >
                  <span>Open Direct Chat</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => onOpenAppointmentModal(`Review ${activeCapLabel} participation: ${clarificationItems[questionIdx]?.short || 'terms & safeguards'}`)}
                className="nv-pdp-secondary-btn"
                style={{ width: 'auto' }}
              >
                <span>Book 15-Min Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
