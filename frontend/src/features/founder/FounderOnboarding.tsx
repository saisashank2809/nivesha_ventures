import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  OnboardingQuestion,
  OnboardingOption,
  OnboardingAnalysisResult,
  User,
} from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

export interface OnboardingCompletionPayload {
  answers: Record<string, any>;
  analysis: OnboardingAnalysisResult;
}

interface FounderOnboardingProps {
  currentUser: User | null;
  onComplete: (payload: OnboardingCompletionPayload) => void;
  onCancel: () => void;
  onOpenLogin: () => void;
}

const normalizeOption = (opt: OnboardingOption | string): OnboardingOption => {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  return opt;
};

const withOtherOption = (opts: OnboardingOption[]): OnboardingOption[] => {
  const hasOther = opts.some((o) => o.value.toLowerCase() === 'other');
  if (hasOther) return opts;
  return [...opts, { value: 'Other', label: 'Other', hint: 'Type your own answer' }];
};

export const FounderOnboarding: React.FC<FounderOnboardingProps> = ({
  currentUser,
  onComplete,
  onCancel,
  onOpenLogin,
}) => {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({
    capital_target: 2500000,
    collateral_type: 'Clean-Title Land',
    offered_return_rate: 14,
    equity_dilution_willingness: 'Open to dilution',
  });
  const [currentStep, setCurrentStep] = useState<number>(0); // 0..11 = 12 questions, 12 = Step 13 Review Card
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<OnboardingAnalysisResult | null>(null);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const qList = await Api.getOnboardingQuestions(true);
        setQuestions(qList);

        if (currentUser?.role === 'FOUNDER') {
          try {
            const profile = await Api.getFounderProfile();
            if (profile?.raw_discovery_answers) {
              setAnswers((prev) => ({ ...prev, ...profile.raw_discovery_answers }));
            }
          } catch {
            // First-time founder: no profile yet
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load discovery flow');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const totalQuestions = questions.length;
  const isReviewStep = totalQuestions > 0 && currentStep >= totalQuestions;
  const activeQuestion = !isReviewStep ? questions[currentStep] : null;

  const resolveAnswersForSubmission = useCallback(
    (raw: Record<string, any>): Record<string, any> => {
      const resolved: Record<string, any> = { ...raw };
      questions.forEach((q) => {
        const key = q.question_key;
        const otherText = String(raw[`${key}_other`] || '').trim();
        if (key === 'collateral_and_return') {
          if (raw.collateral_type === 'Other' && raw.collateral_type_other) {
            resolved.collateral_type = String(raw.collateral_type_other).trim();
          }
        } else if (Array.isArray(raw[key])) {
          resolved[key] = raw[key].map((item: string) =>
            item === 'Other' && otherText ? otherText : item
          );
        } else if (raw[key] === 'Other' && otherText) {
          resolved[key] = otherText;
        }
      });
      return resolved;
    },
    [questions]
  );

  const runAnalysisAndGoToReview = useCallback(
    async (latestAnswers: Record<string, any>) => {
      try {
        setAnalyzing(true);
        setError(null);
        const resolved = resolveAnswersForSubmission(latestAnswers);
        const result = await Api.analyzeOnboardingAnswers(resolved);
        setAnalysis(result);
        setCurrentStep(totalQuestions);
      } catch (err: any) {
        setError(err.message || 'Failed to analyze responses');
      } finally {
        setAnalyzing(false);
      }
    },
    [resolveAnswersForSubmission, totalQuestions]
  );

  const goNext = useCallback(
    (overrideAnswers?: Record<string, any>) => {
      const latest = overrideAnswers || answers;
      if (activeQuestion?.question_key === 'capital_target') {
        const amt = Number(latest.capital_target || 0);
        if (amt < 1000000 && !showFloorModal) {
          setShowFloorModal(true);
          return;
        }
      }
      setShowFloorModal(false);

      if (currentStep + 1 < totalQuestions) {
        setCurrentStep((s) => s + 1);
      } else {
        runAnalysisAndGoToReview(latest);
      }
    },
    [activeQuestion, answers, currentStep, runAnalysisAndGoToReview, showFloorModal, totalQuestions]
  );

  const handleSingleSelect = useCallback(
    (key: string, value: string, autoAdvance = true) => {
      const updated = { ...answers, [key]: value };
      setAnswers(updated);
      if (value === 'Other') {
        setTimeout(() => otherInputRef.current?.focus(), 60);
        return;
      }
      if (autoAdvance) {
        setTimeout(() => goNext(updated), 140);
      }
    },
    [answers, goNext]
  );

  const handleMultiToggle = (key: string, value: string) => {
    const current: string[] = Array.isArray(answers[key]) ? answers[key] : [];
    const willSelect = !current.includes(value);
    const next = willSelect
      ? [...current, value]
      : current.filter((item) => item !== value);
    setAnswers((prev) => ({ ...prev, [key]: next }));
    if (value === 'Other' && willSelect) {
      setTimeout(() => otherInputRef.current?.focus(), 60);
    }
  };

  // Keyboard shortcuts (1-5 to select, Enter to continue)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!activeQuestion || isReviewStep || showFloorModal) return;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        if (e.key === 'Enter') {
          e.preventDefault();
          goNext();
        }
        return;
      }

      const opts = withOtherOption((activeQuestion.options || []).map(normalizeOption));
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= opts.length) {
        const chosen = opts[num - 1];
        if (
          activeQuestion.ui_control_type === 'tap_cards' ||
          activeQuestion.ui_control_type === 'ab_binary'
        ) {
          handleSingleSelect(activeQuestion.question_key, chosen.value, chosen.value !== 'Other');
        } else if (activeQuestion.ui_control_type === 'multi_tap_cards') {
          handleMultiToggle(activeQuestion.question_key, chosen.value);
        } else if (activeQuestion.ui_control_type === 'numeric_presets') {
          if (chosen.value === 'Other') {
            setAnswers((prev) => ({ ...prev, capital_target_mode: 'Other' }));
            setTimeout(() => otherInputRef.current?.focus(), 60);
          } else {
            setAnswers((prev) => ({ ...prev, capital_target_mode: undefined, capital_target: Number(chosen.value) }));
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeQuestion, goNext, handleSingleSelect, isReviewStep, showFloorModal]);

  const handleConfirmAndContinue = async () => {
    if (!currentUser || !Api.getToken()) {
      onOpenLogin();
      return;
    }
    if (!analysis) return;
    try {
      setSubmitting(true);
      setError(null);
      const resolved = resolveAnswersForSubmission(answers);
      const res = await Api.submitOnboardingAnswers(resolved, analysis.founder_summary);
      onComplete({
        answers: resolved,
        analysis: res.analysis || analysis,
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to save onboarding discovery';
      if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('sign in')) {
        onOpenLogin();
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '640px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>FOUNDER DISCOVERY KIOSK</div>
        <h2 style={{ fontSize: '32px', color: 'var(--bg-dark)', marginBottom: '12px' }}>
          Zero-Form Founder Discovery
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
          Sign in as a founder to complete our 12-tap discovery flow. Your background is saved once and
          automatically pre-populates your Story Builder.
        </p>
        <button
          onClick={onOpenLogin}
          style={{
            padding: '13px 28px',
            borderRadius: '8px',
            background: 'var(--bg-dark)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sign In as Founder to Continue
        </button>
      </div>
    );
  }

  if (loading || analyzing) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
          {analyzing ? 'AI Co-Pilot is synthesizing your founder profile...' : 'Loading 12-Step Discovery Flow...'}
        </div>
        <div style={{ fontSize: '13px' }}>Checking ₹10L baseline, value alignment & scaling risks</div>
      </div>
    );
  }

  const progressPct = isReviewStep
    ? 100
    : totalQuestions > 0
      ? Math.round(((currentStep + 1) / totalQuestions) * 100)
      : 0;

  const activeOptions = activeQuestion
    ? withOtherOption((activeQuestion.options || []).map(normalizeOption))
    : [];

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 20px 64px', maxWidth: '780px', margin: '0 auto' }}>
      {/* Top Progress Bar & Back Navigation */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => {
              if (currentStep > 0) {
                setShowFloorModal(false);
                setCurrentStep((s) => s - 1);
              } else {
                onCancel();
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13.5px', cursor: 'pointer', padding: 0 }}
          >
            &larr; {currentStep > 0 ? 'Previous Question' : 'Back to Dashboard'}
          </button>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--bg-dark)', letterSpacing: '0.04em' }}>
            {isReviewStep ? 'STEP 13 OF 13 · AI REVIEW' : `STEP ${currentStep + 1} OF ${totalQuestions}`}
          </span>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent-gold)', transition: 'width 0.25s ease' }} />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--accent-red)', borderRadius: '8px', marginBottom: '20px', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Non-blocking ₹10 Lakh Floor Modal */}
      {showFloorModal && (
        <div style={{ padding: '24px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
            ₹10 Lakh Platform Baseline
          </div>
          <p style={{ fontSize: '14px', color: '#78350f', lineHeight: 1.55, marginBottom: '16px' }}>
            You entered {formatINR(Number(answers.capital_target || 0))}. Nivesha Ventures specializes in
            high-ticket opportunities starting at <strong>₹10,00,000 (₹10 Lakhs)</strong>. Would you like to
            adjust your expansion scope to ₹10L+ or continue to join our early-stage waitlist?
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const updated = { ...answers, capital_target: 1000000 };
                setAnswers(updated);
                setShowFloorModal(false);
                goNext(updated);
              }}
              style={{ padding: '10px 18px', borderRadius: '6px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, fontSize: '13.5px', border: 'none', cursor: 'pointer' }}
            >
              Adjust Scope to ₹10 Lakhs &amp; Continue
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFloorModal(false);
                if (currentStep + 1 < totalQuestions) setCurrentStep((s) => s + 1);
                else runAnalysisAndGoToReview(answers);
              }}
              style={{ padding: '10px 18px', borderRadius: '6px', background: '#ffffff', color: '#92400e', border: '1px solid #f59e0b', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
            >
              Keep Amount &amp; Join Waitlist
            </button>
          </div>
        </div>
      )}

      {/* Active Question Card (Steps 1-12) */}
      {activeQuestion && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-md)' }}>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            {activeQuestion.category.replace(/_/g, ' ').toUpperCase()}
          </div>
          <h1 style={{ fontSize: '28px', color: 'var(--bg-dark)', marginBottom: '10px', lineHeight: 1.25 }}>
            {activeQuestion.label}
          </h1>
          {activeQuestion.description && (
            <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.55 }}>
              {activeQuestion.description}
            </p>
          )}

          {/* 1. Tap Cards & Binary A/B */}
          {(activeQuestion.ui_control_type === 'tap_cards' || activeQuestion.ui_control_type === 'ab_binary') && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: activeQuestion.ui_control_type === 'ab_binary' ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                {activeOptions.map((opt, idx) => {
                  const selected = answers[activeQuestion.question_key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSingleSelect(activeQuestion.question_key, opt.value, opt.value !== 'Other')}
                      style={{
                        textAlign: 'left',
                        padding: '18px 20px',
                        borderRadius: '12px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--bg-dark)' }}>{opt.label}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>
                          {idx + 1}
                        </span>
                      </div>
                      {opt.hint && <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.hint}</span>}
                    </button>
                  );
                })}
              </div>

              {answers[activeQuestion.question_key] === 'Other' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                    Please specify your answer:
                  </label>
                  <input
                    ref={otherInputRef}
                    type="text"
                    value={answers[`${activeQuestion.question_key}_other`] || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [`${activeQuestion.question_key}_other`]: e.target.value,
                      }))
                    }
                    placeholder="Type your custom answer here..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14.5px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      marginBottom: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => goNext()}
                    style={{ padding: '11px 24px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
                  >
                    Continue &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Multi-Select Tap Cards */}
          {activeQuestion.ui_control_type === 'multi_tap_cards' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                {activeOptions.map((opt, idx) => {
                  const current: string[] = Array.isArray(answers[activeQuestion.question_key])
                    ? answers[activeQuestion.question_key]
                    : [];
                  const selected = current.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleMultiToggle(activeQuestion.question_key, opt.value)}
                      style={{
                        padding: '13px 18px',
                        borderRadius: '10px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? 'var(--bg-dark)' : '#ffffff',
                        color: selected ? '#ffffff' : 'var(--bg-dark)',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{selected ? '✓' : `${idx + 1}.`}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {Array.isArray(answers[activeQuestion.question_key]) &&
                answers[activeQuestion.question_key].includes('Other') && (
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                      Specify your other capability / use of funds:
                    </label>
                    <input
                      ref={otherInputRef}
                      type="text"
                      value={answers[`${activeQuestion.question_key}_other`] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [`${activeQuestion.question_key}_other`]: e.target.value,
                        }))
                      }
                      placeholder="Type your custom answer here..."
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '14.5px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

              <button
                type="button"
                onClick={() => goNext()}
                style={{ padding: '12px 26px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, fontSize: '14.5px', border: 'none', cursor: 'pointer' }}
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* 3. Numeric Presets (₹10L+ Floor) */}
          {activeQuestion.ui_control_type === 'numeric_presets' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {activeOptions.map((opt) => {
                  const isOther = opt.value === 'Other';
                  const numVal = Number(opt.value);
                  const selected = isOther
                    ? answers.capital_target_mode === 'Other'
                    : answers.capital_target_mode !== 'Other' && Number(answers.capital_target) === numVal;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isOther) {
                          setAnswers((prev) => ({ ...prev, capital_target_mode: 'Other' }));
                          setTimeout(() => otherInputRef.current?.focus(), 60);
                        } else {
                          setAnswers((prev) => ({ ...prev, capital_target_mode: undefined, capital_target: numVal }));
                        }
                      }}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '999px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? 'var(--bg-dark)' : '#f8fafc',
                        color: selected ? '#ffffff' : 'var(--bg-dark)',
                        fontWeight: 700,
                        fontSize: '14.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {answers.capital_target_mode === 'Other' && (
                <div style={{ marginBottom: '18px', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                    Custom Capital Note / Tranche Details:
                  </label>
                  <input
                    ref={otherInputRef}
                    type="text"
                    value={answers.capital_target_other || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, capital_target_other: e.target.value }))}
                    placeholder="e.g., ₹75L in 2 tranches (₹40L upfront + ₹35L milestone)"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Exact Capital Amount (INR)
                </label>
                <input
                  type="number"
                  min={100000}
                  step={100000}
                  value={answers.capital_target ?? 1000000}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, capital_target: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '14px 16px', fontSize: '18px', fontWeight: 700, borderRadius: '10px', border: '1px solid var(--border-light)', boxSizing: 'border-box' }}
                />
                <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Formatted: <strong>{formatINR(Number(answers.capital_target || 0))}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goNext()}
                style={{ padding: '12px 26px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, fontSize: '14.5px', border: 'none', cursor: 'pointer' }}
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* 4. Conditional Collateral + Return Slider */}
          {activeQuestion.ui_control_type === 'conditional_collateral_slider' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {activeOptions.map((opt) => {
                  const selected = answers.collateral_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, collateral_type: opt.value }));
                        if (opt.value === 'Other') {
                          setTimeout(() => otherInputRef.current?.focus(), 60);
                        }
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: '10px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--bg-dark)', marginBottom: '4px' }}>{opt.label}</div>
                      {opt.hint && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{opt.hint}</div>}
                    </button>
                  );
                })}
              </div>

              {answers.collateral_type === 'Other' && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                    Describe the collateral or security you are offering:
                  </label>
                  <input
                    ref={otherInputRef}
                    type="text"
                    value={answers.collateral_type_other || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, collateral_type_other: e.target.value }))}
                    placeholder="e.g., Commercial lease deposit, inventory pledge, personal guarantee..."
                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {answers.proposed_arrangement === 'Pure Equity / Dividend' && (
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                    Equity Dilution Stance
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Open to dilution', 'Zero Dilution'].map((stance) => {
                      const active = answers.equity_dilution_willingness === stance;
                      return (
                        <button
                          key={stance}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, equity_dilution_willingness: stance }))}
                          style={{
                            padding: '9px 16px',
                            borderRadius: '8px',
                            border: active ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                            background: active ? 'var(--bg-dark)' : '#fff',
                            color: active ? '#fff' : 'var(--bg-dark)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {stance}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '26px', padding: '18px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--bg-dark)' }}>
                    Target Annual Return / Yield Offered
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                    {answers.offered_return_rate ?? 14}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={answers.offered_return_rate ?? 14}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, offered_return_rate: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>8% (Low-cost secured)</span>
                  <span>14% (Market benchmark)</span>
                  <span>24% (High-yield)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goNext()}
                style={{ padding: '12px 26px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, fontSize: '14.5px', border: 'none', cursor: 'pointer' }}
              >
                Continue &rarr;
              </button>
            </div>
          )}

          <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Tip: Use number keys <strong>1–{activeOptions.length}</strong> for quick selection, or press <strong>Enter</strong> to advance.
          </div>
        </div>
      )}

      {/* Step 13: AI Founder Review Card */}
      {isReviewStep && analysis && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-md)' }}>
          <div className="eyebrow" style={{ marginBottom: '6px' }}>AI CO-PILOT SYNTHESIS · STEP 13</div>
          <h1 style={{ fontSize: '26px', color: 'var(--bg-dark)', marginBottom: '14px' }}>
            Review Your Structured Founder Profile
          </h1>

          {/* Structured Summary */}
          <div style={{ padding: '18px 20px', background: '#f8fafc', borderRadius: '10px', borderLeft: '4px solid var(--accent-gold)', fontSize: '14.5px', lineHeight: 1.6, color: 'var(--bg-dark)', marginBottom: '22px' }}>
            {analysis.founder_summary}
          </div>

          {/* Value Discovery Tips */}
          {analysis.value_discovery_tips.length > 0 && (
            <div style={{ padding: '16px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                AI Value-Protection Insight
              </div>
              {analysis.value_discovery_tips.map((tip, i) => (
                <p key={i} style={{ fontSize: '13.5px', color: '#1e3a8a', margin: '4px 0', lineHeight: 1.5 }}>
                  {tip}
                </p>
              ))}
            </div>
          )}

          {/* Detected Conflicts */}
          {analysis.detected_conflicts.length > 0 && (
            <div style={{ padding: '16px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
                Mentor Risk &amp; Trade-Off Checks
              </div>
              {analysis.detected_conflicts.map((conflict, i) => (
                <p key={i} style={{ fontSize: '13.5px', color: '#7f1d1d', margin: '4px 0', lineHeight: 1.5 }}>
                  • {conflict}
                </p>
              ))}
            </div>
          )}

          {/* Scaling Reality Check Chips */}
          {analysis.reality_check_chips.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                Scaling Reality Check (Hidden Costs to Factor Into Story Builder)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysis.reality_check_chips.map((chip, i) => (
                  <span key={i} style={{ padding: '7px 12px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontSize: '12.5px', fontWeight: 600 }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile Scope Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px' }}>
              <div style={{ fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '4px' }}>Saved to Founder Profile (Editable)</div>
              <div style={{ color: 'var(--text-muted)' }}>
                Role, Experience, Execution Strengths, Continuity Backup, 3-Year Goal, Bottleneck, Investor Style, Update Cadence &amp; AI Summary.
              </div>
            </div>
            <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px' }}>
              <div style={{ fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '4px' }}>Saved to Venture Deal (Editable)</div>
              <div style={{ color: 'var(--text-muted)' }}>
                Capital Target, Use of Funds, Preferred Arrangement &amp; Collateral / Return Rate. Email &amp; verification badges stay read-only.
              </div>
            </div>
          </div>

          {/* Tap-to-Edit Pills */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
              Tap any pill to jump back and edit:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {questions.map((q, idx) => {
                const resolved = resolveAnswersForSubmission(answers);
                let displayVal = resolved[q.question_key];
                if (q.question_key === 'capital_target') {
                  displayVal = resolved.capital_target_other
                    ? `${formatINR(Number(displayVal || 0))} (${resolved.capital_target_other})`
                    : formatINR(Number(displayVal || 0));
                } else if (q.question_key === 'collateral_and_return') {
                  displayVal = `${resolved.collateral_type || 'Unsecured'} · ${resolved.offered_return_rate ?? 14}%`;
                } else if (Array.isArray(displayVal)) {
                  displayVal = displayVal.join(', ');
                }
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: '#ffffff',
                      fontSize: '12.5px',
                      color: 'var(--bg-dark)',
                      cursor: 'pointer',
                    }}
                  >
                    <strong>{idx + 1}.</strong> {String(displayVal || 'Not set')}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmAndContinue}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '10px',
              background: 'var(--bg-dark)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving Profile...' : 'Confirm & Continue to 7-Step Story Builder →'}
          </button>
        </div>
      )}
    </div>
  );
};
