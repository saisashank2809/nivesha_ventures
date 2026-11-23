import React, { useState, useEffect } from 'react';
import { OnboardingQuestion, User } from '../../shared/types';
import { Api } from '../../shared/api';

interface FounderOnboardingProps {
  currentUser: User | null;
  onComplete: () => void;
  onCancel: () => void;
  onOpenLogin: () => void;
}

export const FounderOnboarding: React.FC<FounderOnboardingProps> = ({
  currentUser,
  onComplete,
  onCancel,
  onOpenLogin,
}) => {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const qList = await Api.getOnboardingQuestions();
        setQuestions(qList);

        if (qList.length > 0) {
          setActiveSection(qList[0].section);
        }

        // If user is logged in as founder, fetch existing venture answers
        if (currentUser?.role === 'FOUNDER') {
          try {
            const venture = await Api.getMyVenture();
            if (venture && venture.custom_answers) {
              setAnswers(venture.custom_answers);
            }
          } catch (err) {
            // No current venture or first-time onboarding
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Group questions by section
  const sections = Array.from(new Set(questions.map((q) => q.section)));

  const handleFieldChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMultiSelectToggle = (key: string, option: string) => {
    const current = (answers[key] as string[]) || [];
    if (current.includes(option)) {
      handleFieldChange(
        key,
        current.filter((item) => item !== option)
      );
    } else {
      handleFieldChange(key, [...current, option]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await Api.submitOnboardingAnswers(answers);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save responses');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '720px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--bg-dark)', marginBottom: '14px' }}>
          Founder Onboarding Questionnaire
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Please log in or create your founder profile first to complete and persist your verification answers.
        </p>
        <button
          onClick={onOpenLogin}
          style={{
            padding: '12px 28px',
            borderRadius: '6px',
            background: 'var(--bg-dark)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Sign In as Founder to Continue
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        Loading diligence questionnaire...
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          maxWidth: '680px',
          margin: '80px auto',
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '14px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#e9f5ed',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px',
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: '28px', color: 'var(--bg-dark)', marginBottom: '12px' }}>
          Responses Recorded & Saved
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
          Your responses have been attached to your company profile. Our independent review desk will review these inputs
          and update your verified brief for accredited investors.
        </p>
        <button
          onClick={onComplete}
          style={{
            padding: '12px 30px',
            borderRadius: '6px',
            background: 'var(--bg-dark)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Go to Founder Dashboard &rarr;
        </button>
      </div>
    );
  }

  const currentQuestions = questions.filter((q) => q.section === activeSection);
  const currentSectionIdx = sections.indexOf(activeSection);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          &larr; Back to Dashboard
        </button>
        <div className="eyebrow">EXTENSIBLE DILIGENCE QUESTIONNAIRE</div>
        <h1 style={{ fontSize: '34px', color: 'var(--bg-dark)', marginTop: '4px', marginBottom: '8px' }}>
          Founder Onboarding
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
          Provide clear, verifiable information about your company. These answers formulate the basis of your
          independent diligence report seen by qualified investors.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: 'var(--accent-red)',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Section Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '32px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {sections.map((sec, idx) => {
          const isActive = sec === activeSection;
          return (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              style={{
                padding: '10px 16px',
                background: isActive ? '#ffffff' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                color: isActive ? 'var(--bg-dark)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {idx + 1}. {sec}
            </button>
          );
        })}
      </div>

      {/* Active Section Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: '20px', color: 'var(--bg-dark)', marginBottom: '4px' }}>
            {activeSection}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Section {currentSectionIdx + 1} of {sections.length}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {currentQuestions.map((q) => {
              const val = answers[q.question_key] !== undefined ? answers[q.question_key] : '';

              return (
                <div key={q.id}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--bg-dark)',
                      marginBottom: '6px',
                    }}
                  >
                    {q.label}
                    {q.is_mandatory && <span style={{ color: 'var(--accent-red)', marginLeft: '4px' }}>*</span>}
                  </label>

                  {q.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {q.description}
                    </div>
                  )}

                  {/* Render based on question_type */}
                  {q.question_type === 'TEXTAREA' ? (
                    <textarea
                      rows={4}
                      value={val}
                      placeholder={q.placeholder || ''}
                      onChange={(e) => handleFieldChange(q.question_key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        outline: 'none',
                        background: '#fcfaf6',
                      }}
                    />
                  ) : q.question_type === 'SELECT' ? (
                    <select
                      value={val}
                      onChange={(e) => handleFieldChange(q.question_key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        background: '#ffffff',
                      }}
                    >
                      <option value="">Select option...</option>
                      {q.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : q.question_type === 'MULTISELECT' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {q.options?.map((opt) => {
                        const selectedList = (answers[q.question_key] as string[]) || [];
                        const isSel = selectedList.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleMultiSelectToggle(q.question_key, opt)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: isSel ? '1px solid var(--accent-gold)' : '1px solid var(--border-light)',
                              background: isSel ? 'var(--accent-gold-light)' : '#ffffff',
                              color: isSel ? 'var(--accent-gold)' : 'var(--text-main)',
                              fontSize: '12.5px',
                              fontWeight: isSel ? 600 : 400,
                              cursor: 'pointer',
                            }}
                          >
                            {isSel ? '✓ ' : '+ '}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type={q.question_type === 'NUMBER' || q.question_type === 'CURRENCY' ? 'number' : 'text'}
                      value={val}
                      placeholder={q.placeholder || ''}
                      onChange={(e) => handleFieldChange(q.question_key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        outline: 'none',
                        background: '#fcfaf6',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation / Save Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentSectionIdx > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection(sections[currentSectionIdx - 1])}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                &larr; Previous Section
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentSectionIdx < sections.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveSection(sections[currentSectionIdx + 1])}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  background: 'var(--bg-dark)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                Next Section &rarr;
              </button>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                background: 'var(--accent-gold)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13.5px',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Save All Responses'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
