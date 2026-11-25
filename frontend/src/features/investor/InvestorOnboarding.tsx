import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  OnboardingQuestion,
  OnboardingOption,
  InvestorAnalysisResult,
  User,
} from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface InvestorOnboardingProps {
  currentUser: User | null;
  onComplete: () => void;
  onCancel: () => void;
  onOpenLogin: () => void;
}

const normalizeOption = (opt: OnboardingOption | string): OnboardingOption => {
  if (typeof opt === 'string') return { value: opt, label: opt };
  return opt;
};

const withOtherOption = (opts: OnboardingOption[]): OnboardingOption[] => {
  if (opts.some((o) => o.value.toLowerCase() === 'other')) return opts;
  return [...opts, { value: 'Other', label: 'Other', hint: 'Specify your own preference' }];
};

export const InvestorOnboarding: React.FC<InvestorOnboardingProps> = ({
  currentUser,
  onComplete,
  onCancel,
  onOpenLogin,
}) => {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({
    ticket_min: 1000000,
    ticket_max: 5000000,
    locations: ['India'],
    expected_evidence: ['Financial records', 'Customer traction'],
    mandatory_sectors: [],
    mandatory_arrangements: [],
    risk_clarifications: {},
  });
  const [naturalNote, setNaturalNote] = useState('');
  const [extractingNote, setExtractingNote] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<InvestorAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const qList = await Api.getOnboardingQuestions(true, 'investor_discovery');
        setQuestions(qList);

        if (currentUser?.role === 'INVESTOR') {
          try {
            const profile = await Api.getInvestorProfile();
            if (profile?.raw_discovery_answers) {
              setAnswers((prev) => ({ ...prev, ...profile.raw_discovery_answers }));
            }
          } catch {
            // First-time investor onboarding
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load investor discovery');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const totalQuestions = questions.length;
  const isReviewStep = totalQuestions > 0 && currentStep >= totalQuestions;
  const activeQuestion = !isReviewStep ? questions[currentStep] : null;

  const resolveAnswers = useCallback(
    (raw: Record<string, any>): Record<string, any> => {
      const resolved: Record<string, any> = { ...raw };
      questions.forEach((q) => {
        const key = q.question_key;
        const otherText = String(raw[`${key}_other`] || '').trim();
        if (Array.isArray(raw[key])) {
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

  const handleExtractNaturalNote = async () => {
    if (!naturalNote.trim()) return;
    try {
      setExtractingNote(true);
      const res = await Api.analyzeInvestorOnboarding(resolveAnswers(answers), naturalNote);
      const prop = res.proposed_mandate || {};
      setAnswers((prev) => ({
        ...prev,
        ...(prop.ticket_max ? { ticket_max: prop.ticket_max } : {}),
        ...(prop.target_sectors?.length ? { target_sectors: prop.target_sectors } : {}),
        ...(prop.target_stages?.length ? { target_stages: prop.target_stages } : {}),
        ...(prop.desired_involvement ? { desired_involvement: prop.desired_involvement } : {}),
      }));
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Could not parse your description');
    } finally {
      setExtractingNote(false);
    }
  };

  const runAnalysisAndReview = useCallback(
    async (latest: Record<string, any>) => {
      try {
        setAnalyzing(true);
        setError(null);
        const resolved = resolveAnswers(latest);
        const res = await Api.analyzeInvestorOnboarding(resolved, naturalNote);
        setAnalysis(res);
        setCurrentStep(totalQuestions);
      } catch (err: any) {
        setError(err.message || 'Failed to analyze investor preferences');
      } finally {
        setAnalyzing(false);
      }
    },
    [naturalNote, resolveAnswers, totalQuestions]
  );

  const goNext = useCallback(
    (override?: Record<string, any>) => {
      const latest = override || answers;
      if (currentStep + 1 < totalQuestions) {
        setCurrentStep((s) => s + 1);
      } else {
        runAnalysisAndReview(latest);
      }
    },
    [answers, currentStep, runAnalysisAndReview, totalQuestions]
  );

  const handleSingleSelect = (key: string, value: string, autoAdvance = true) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    if (value === 'Other') {
      setTimeout(() => otherInputRef.current?.focus(), 60);
      return;
    }
    if (autoAdvance) {
      setTimeout(() => goNext(updated), 140);
    }
  };

  const handleMultiToggle = (key: string, value: string) => {
    const current: string[] = Array.isArray(answers[key]) ? answers[key] : [];
    const willSelect = !current.includes(value);
    const next = willSelect ? [...current, value] : current.filter((i) => i !== value);
    setAnswers((prev) => ({ ...prev, [key]: next }));
    if (value === 'Other' && willSelect) {
      setTimeout(() => otherInputRef.current?.focus(), 60);
    }
  };

  const toggleMandatory = (field: 'mandatory_sectors' | 'mandatory_arrangements', value: string) => {
    const current: string[] = Array.isArray(answers[field]) ? answers[field] : [];
    const next = current.includes(value) ? current.filter((i) => i !== value) : [...current, value];
    setAnswers((prev) => ({ ...prev, [field]: next }));
  };

  const handleConfirmMandate = async () => {
    if (!currentUser || !Api.getToken()) {
      onOpenLogin();
      return;
    }
    if (!analysis) return;
    try {
      setSubmitting(true);
      setError(null);
      const resolved = resolveAnswers(answers);
      const confirmedMandate = {
        ...analysis.proposed_mandate,
        mandatory_sectors: answers.mandatory_sectors || [],
        mandatory_arrangements: answers.mandatory_arrangements || [],
        locations: answers.locations || ['India'],
      };
      await Api.submitInvestorOnboarding(resolved, confirmedMandate, analysis.investor_summary);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save investor mandate');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '640px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>INVESTOR DISCOVERY</div>
        <h2 style={{ fontSize: '30px', color: 'var(--bg-dark)', marginBottom: '12px' }}>
          Guided Investor Onboarding
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '26px', lineHeight: 1.6 }}>
          Sign in as an investor to define your investment goals, risk preferences, and mandate criteria.
        </p>
        <button
          onClick={onOpenLogin}
          style={{ padding: '12px 26px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Sign In as Investor
        </button>
      </div>
    );
  }

  if (loading || analyzing) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
          {analyzing ? 'AI Co-Pilot is preparing your Investor Mandate proposal...' : 'Loading 15-Step Investor Discovery...'}
        </div>
        <div style={{ fontSize: '13px' }}>Checking objective alignment, risk clarity, and matching criteria</div>
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
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 20px 64px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => (currentStep > 0 ? setCurrentStep((s) => s - 1) : onCancel())}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13.5px', cursor: 'pointer', padding: 0 }}
          >
            &larr; {currentStep > 0 ? 'Previous Question' : 'Back to Matches'}
          </button>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--bg-dark)', letterSpacing: '0.04em' }}>
            {isReviewStep ? 'STEP 16 OF 16 · CONFIRM MANDATE' : `STEP ${currentStep + 1} OF ${totalQuestions}`}
          </span>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent-gold)', transition: 'width 0.25s ease' }} />
        </div>
      </div>

      {/* Optional AI Natural-Language Quick-Fill on Step 1 */}
      {currentStep === 0 && !isReviewStep && (
        <div style={{ background: '#fffdf9', border: '1px solid #d6c9b2', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '6px' }}>
            Optional: Describe what you are looking for in your own words
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={naturalNote}
              onChange={(e) => setNaturalNote(e.target.value)}
              placeholder='e.g., "I have ₹1 crore available for profitable manufacturing companies, periodic updates, no daily ops."'
              style={{ flex: '1 1 320px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px' }}
            />
            <button
              type="button"
              disabled={extractingNote || !naturalNote.trim()}
              onClick={handleExtractNaturalNote}
              style={{ padding: '10px 16px', background: '#7a5c2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {extractingNote ? 'Extracting...' : 'AI Pre-Fill'}
            </button>
          </div>
          {analysis?.follow_up_questions && analysis.follow_up_questions.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#92400e', background: '#fffbeb', padding: '8px 12px', borderRadius: '6px' }}>
              <strong>AI Follow-up:</strong> {analysis.follow_up_questions[0]}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--accent-red)', borderRadius: '8px', marginBottom: '18px', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Question Card */}
      {activeQuestion && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '34px', boxShadow: 'var(--shadow-md)' }}>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            {activeQuestion.section.replace(/_/g, ' ')}
          </div>
          <h1 style={{ fontSize: '26px', color: 'var(--bg-dark)', marginBottom: '10px', lineHeight: 1.25 }}>
            {activeQuestion.label}
          </h1>
          {activeQuestion.description && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {activeQuestion.description}
            </p>
          )}

          {/* Single-Select / AB Binary */}
          {(activeQuestion.ui_control_type === 'tap_cards' || activeQuestion.ui_control_type === 'ab_binary') && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {activeOptions.map((opt) => {
                  const selected = answers[activeQuestion.question_key] === opt.value;
                  const skipAuto = opt.value === 'Other' || activeQuestion.question_key === 'risk_tolerance_level';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSingleSelect(activeQuestion.question_key, opt.value, !skipAuto)}
                      style={{
                        textAlign: 'left',
                        padding: '16px 18px',
                        borderRadius: '12px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--bg-dark)' }}>{opt.label}</div>
                      {opt.hint && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{opt.hint}</div>}
                    </button>
                  );
                })}
              </div>

              {answers[activeQuestion.question_key] === 'Other' && (
                <div style={{ marginTop: '18px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <input
                    ref={otherInputRef}
                    type="text"
                    value={answers[`${activeQuestion.question_key}_other`] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [`${activeQuestion.question_key}_other`]: e.target.value }))}
                    placeholder="Type your custom preference..."
                    style={{ width: '100%', padding: '11px 13px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => goNext()}
                    style={{ padding: '10px 22px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Continue &rarr;
                  </button>
                </div>
              )}

              {/* Contextual Risk Clarifications (Q12) */}
              {activeQuestion.question_key === 'risk_tolerance_level' && answers.risk_tolerance_level && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '10px' }}>
                    Risk Clarification (Check any that you can tolerate):
                  </div>
                  {[
                    { key: 'illiquidity_3yr', label: 'Funds committed for 3+ years without early exit' },
                    { key: 'irregular_returns', label: 'Irregular or milestone-based returns instead of monthly payouts' },
                    { key: 'partial_loss', label: 'Losing part or all of a single private investment' },
                  ].map((item) => {
                    const checked = Boolean(answers.risk_clarifications?.[item.key]);
                    return (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              risk_clarifications: {
                                ...(prev.risk_clarifications || {}),
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => goNext()}
                    style={{ marginTop: '8px', padding: '10px 22px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Continue &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Multi-Select */}
          {activeQuestion.ui_control_type === 'multi_tap_cards' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {activeOptions.map((opt) => {
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
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: selected ? '2px solid var(--bg-dark)' : '1px solid var(--border-light)',
                        background: selected ? 'var(--bg-dark)' : '#ffffff',
                        color: selected ? '#ffffff' : 'var(--bg-dark)',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{opt.label}
                    </button>
                  );
                })}
              </div>

              {Array.isArray(answers[activeQuestion.question_key]) &&
                answers[activeQuestion.question_key].includes('Other') && (
                  <div style={{ marginBottom: '18px' }}>
                    <input
                      ref={otherInputRef}
                      type="text"
                      value={answers[`${activeQuestion.question_key}_other`] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [`${activeQuestion.question_key}_other`]: e.target.value }))}
                      placeholder="Specify other option..."
                      style={{ width: '100%', padding: '11px 13px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

              {/* Locations & Expected Evidence on Final Step (Q15) */}
              {currentStep === totalQuestions - 1 && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '8px' }}>
                    Preferred Locations &amp; Expected Evidence
                  </div>
                  <input
                    type="text"
                    value={(answers.locations || ['India']).join(', ')}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, locations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    placeholder="e.g., India, Bengaluru, Hyderabad"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Financial records', 'Customer traction', 'Asset information', 'Legal documentation'].map((ev) => {
                      const active = (answers.expected_evidence || []).includes(ev);
                      return (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => handleMultiToggle('expected_evidence', ev)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: active ? '2px solid var(--bg-dark)' : '1px solid #cbd5e1',
                            background: active ? 'var(--bg-dark)' : '#fff',
                            color: active ? '#fff' : 'var(--bg-dark)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {active ? '✓ ' : ''}{ev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => goNext()}
                style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                {currentStep === totalQuestions - 1 ? 'Review Proposed Mandate →' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Ticket Range (Q11) */}
          {activeQuestion.ui_control_type === 'numeric_presets' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                {activeOptions.map((opt) => {
                  const isOther = opt.value === 'Other';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isOther) {
                          setAnswers((prev) => ({ ...prev, ticket_mode: 'Other' }));
                        } else {
                          const [mn, mx] = opt.value.split('-').map(Number);
                          setAnswers((prev) => ({ ...prev, ticket_mode: undefined, ticket_min: mn, ticket_max: mx }));
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-light)',
                        background: '#f8fafc',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Minimum Ticket (INR)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    step={100000}
                    value={answers.ticket_min ?? 1000000}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, ticket_min: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatINR(Number(answers.ticket_min || 0))}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Maximum Ticket (INR)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    step={100000}
                    value={answers.ticket_max ?? 5000000}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, ticket_max: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatINR(Number(answers.ticket_max || 0))}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goNext()}
                style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Continue &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 16: Confirm Mandate & AI Insights */}
      {isReviewStep && analysis && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '34px', boxShadow: 'var(--shadow-md)' }}>
          <div className="eyebrow" style={{ marginBottom: '6px' }}>PROPOSED INVESTOR MANDATE · STEP 16</div>
          <h1 style={{ fontSize: '26px', color: 'var(--bg-dark)', marginBottom: '14px' }}>
            Confirm Your Investor Profile &amp; Matching Criteria
          </h1>

          <div style={{ padding: '16px 18px', background: '#f8fafc', borderLeft: '4px solid var(--accent-gold)', borderRadius: '8px', fontSize: '14px', lineHeight: 1.6, marginBottom: '18px' }}>
            {analysis.investor_summary}
          </div>

          {analysis.detected_conflicts.length > 0 && (
            <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
                Potential Preference Conflicts Detected
              </div>
              {analysis.detected_conflicts.map((c, i) => (
                <p key={i} style={{ fontSize: '13px', color: '#7f1d1d', margin: '4px 0' }}>• {c}</p>
              ))}
            </div>
          )}

          {analysis.terminology_notes.length > 0 && (
            <div style={{ padding: '14px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                Structure &amp; Terminology Guide
              </div>
              {analysis.terminology_notes.map((n, i) => (
                <p key={i} style={{ fontSize: '13px', color: '#1e3a8a', margin: '4px 0' }}>• {n}</p>
              ))}
            </div>
          )}

          {/* Mandatory vs Flexible Toggle */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#fffdf9', border: '1px solid #d6c9b2', borderRadius: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '8px' }}>
              Mark Non-Negotiable (Mandatory) Sectors &amp; Structures
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {(analysis.proposed_mandate.target_sectors || []).map((sec) => {
                const isMand = (answers.mandatory_sectors || []).includes(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleMandatory('mandatory_sectors', sec)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: isMand ? '2px solid #991b1b' : '1px solid #cbd5e1',
                      background: isMand ? '#fef2f2' : '#fff',
                      color: isMand ? '#991b1b' : 'var(--bg-dark)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isMand ? '🔒 Mandatory: ' : 'Flexible: '}{sec}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(analysis.proposed_mandate.accepted_arrangements || []).map((arr) => {
                const isMand = (answers.mandatory_arrangements || []).includes(arr);
                return (
                  <button
                    key={arr}
                    type="button"
                    onClick={() => toggleMandatory('mandatory_arrangements', arr)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: isMand ? '2px solid #991b1b' : '1px solid #cbd5e1',
                      background: isMand ? '#fef2f2' : '#fff',
                      color: isMand ? '#991b1b' : 'var(--bg-dark)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isMand ? '🔒 Mandatory: ' : 'Flexible: '}{arr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tap-to-Edit Pills */}
          <div style={{ marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {questions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
              >
                <strong>{idx + 1}.</strong> {q.question_key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {analysis.suitability_disclaimer}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmMandate}
            style={{ width: '100%', padding: '14px 24px', borderRadius: '10px', background: 'var(--bg-dark)', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}
          >
            {submitting ? 'Saving Mandate & Running Matches...' : 'Confirm Mandate & View Venture Matches →'}
          </button>
        </div>
      )}
    </div>
  );
};
