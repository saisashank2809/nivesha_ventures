import React, { useState, useEffect } from 'react';
import { InvestorProfile, User } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface InvestorProfileViewProps {
  currentUser: User | null;
  onOpenOnboarding: () => void;
  onBackToMatches: () => void;
}

export const InvestorProfileView: React.FC<InvestorProfileViewProps> = ({
  currentUser,
  onOpenOnboarding,
  onBackToMatches,
}) => {
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [firm, setFirm] = useState(currentUser?.firm_or_company || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [investorType, setInvestorType] = useState('');
  const [capacityType, setCapacityType] = useState('');
  const [background, setBackground] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [objective, setObjective] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const fp = await Api.getInvestorProfile();
        setProfile(fp);
        setFullName(fp.full_name || currentUser?.full_name || '');
        setTitle(fp.title ?? currentUser?.title ?? '');
        setFirm(fp.firm_or_company ?? currentUser?.firm_or_company ?? '');
        setBio(fp.bio ?? currentUser?.bio ?? '');
        setInvestorType(fp.investor_type || '');
        setCapacityType(fp.investing_capacity_type || '');
        setBackground((fp.professional_background || []).join(', '));
        setExperienceLevel(fp.experience_level || '');
        setObjective(fp.primary_objective || '');
        setRiskTolerance(fp.risk_tolerance_level || '');
      } catch {
        // Not completed onboarding yet
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.role === 'INVESTOR') load();
    else setLoading(false);
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await Api.updateInvestorProfile({
        full_name: fullName,
        title,
        firm_or_company: firm,
        bio,
        investor_type: investorType,
        investing_capacity_type: capacityType,
        professional_background: background.split(',').map((s) => s.trim()).filter(Boolean),
        experience_level: experienceLevel,
        primary_objective: objective,
        risk_tolerance_level: riskTolerance,
      });
      setProfile(updated);
      if (currentUser) {
        Api.setCurrentUser({
          ...currentUser,
          full_name: updated.full_name || currentUser.full_name,
          title: updated.title ?? currentUser.title,
          firm_or_company: updated.firm_or_company ?? currentUser.firm_or_company,
          bio: updated.bio ?? currentUser.bio,
        });
      }
      setToast('Investor profile updated!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>Loading investor profile...</div>;
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '76px', right: '24px', background: '#0c1826', color: '#fff', padding: '12px 20px', borderRadius: '6px', borderLeft: '4px solid #15803d', zIndex: 999 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button type="button" onClick={onBackToMatches} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '6px' }}>
            &larr; Back to Venture Matches
          </button>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#121a29', fontFamily: 'Newsreader, Georgia, serif' }}>
            Investor Profile
          </h1>
        </div>
        <button type="button" onClick={onOpenOnboarding} style={{ padding: '9px 18px', background: '#7a5c2e', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {profile?.onboarding_completed ? 'Re-run 15-Step Discovery →' : 'Start 15-Step Discovery →'}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: '#fffdf9', border: '1px solid #d6c9b2', padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '18px', color: '#121a29' }}>1. Basic Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Title / Role</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Firm / Family Office</label>
              <input type="text" value={firm} onChange={(e) => setFirm(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Account Email (Read-Only)</label>
              <input type="text" value={currentUser?.email || ''} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Investor Bio</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ background: '#fffdf9', border: '1px solid #d6c9b2', padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '18px', color: '#121a29' }}>2. Background &amp; Preferences</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Investor Type</label>
              <input type="text" value={investorType} onChange={(e) => setInvestorType(e.target.value)} placeholder="Angel / Family Office / Individual" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Investing Capacity</label>
              <input type="text" value={capacityType} onChange={(e) => setCapacityType(e.target.value)} placeholder="Personally / Organization" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Professional Background (comma-separated)</label>
              <input type="text" value={background} onChange={(e) => setBackground(e.target.value)} placeholder="Technology, Manufacturing, Finance" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Private Investing Experience</label>
              <input type="text" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="Beginner / Some experience / Experienced" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Primary Objective</label>
              <input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Regular income / Long-term capital growth" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4c5262', marginBottom: '6px' }}>Self-Reported Risk Stance</label>
              <input type="text" value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ padding: '12px 26px', background: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Investor Profile'}
          </button>
        </div>
      </form>

      {/* 3. Saved Discovery Answers (15 Questions) */}
      <div style={{ marginTop: '28px', background: '#fffdf9', border: '1px solid #d6c9b2', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#121a29' }}>3. Saved Discovery Answers (15 Questions)</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4c5262' }}>
              All responses from your 15-step investor discovery flow.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenOnboarding}
            style={{ padding: '8px 16px', background: '#7a5c2e', color: '#fff', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Edit 15-Step Answers &rarr;
          </button>
        </div>

        {(() => {
          const raw = profile?.raw_discovery_answers || {};
          const fmtList = (v: any) => (Array.isArray(v) ? v.join(', ') : v);
          const rows = [
            { num: '01', cat: 'Background', q: 'What best describes you as an investor?', a: raw.investor_type || profile?.investor_type },
            { num: '02', cat: 'Background', q: 'Investing personally or representing an organization?', a: raw.investing_capacity_type || profile?.investing_capacity_type },
            { num: '03', cat: 'Background', q: 'What is your professional or industry background?', a: fmtList(raw.professional_background || profile?.professional_background) },
            { num: '04', cat: 'Experience', q: 'Have you invested in private businesses before?', a: raw.past_private_investments ?? (profile?.past_private_investments === true ? 'Yes' : profile?.past_private_investments === false ? 'No' : undefined) },
            { num: '05', cat: 'Experience', q: 'How experienced are you with private business investments?', a: raw.experience_level || profile?.experience_level },
            { num: '06', cat: 'Experience', q: 'Which investment structures have you used before?', a: fmtList(raw.prior_structures_used || profile?.prior_structures_used) },
            { num: '07', cat: 'Experience', q: 'What matters most when evaluating a business?', a: fmtList(raw.evaluation_priorities || profile?.evaluation_priorities) },
            { num: '08', cat: 'Goals', q: 'What is your primary investment objective?', a: raw.primary_objective || profile?.primary_objective },
            { num: '09', cat: 'Goals', q: 'How long are you comfortable committing your capital?', a: raw.time_horizon },
            { num: '10', cat: 'Goals', q: 'How involved would you like to be in the business?', a: raw.desired_involvement },
            { num: '11', cat: 'Capital & Risk', q: 'Typical investment range per venture (INR)', a: raw.ticket_min || raw.ticket_max ? `${formatINR(Number(raw.ticket_min || 1000000))} – ${formatINR(Number(raw.ticket_max || 5000000))}` : undefined },
            { num: '12', cat: 'Capital & Risk', q: 'Level of investment uncertainty & loss tolerance', a: raw.risk_tolerance_level || profile?.risk_tolerance_level },
            { num: '13', cat: 'Capital & Risk', q: 'Which financing arrangements would you consider?', a: fmtList(raw.accepted_arrangements) },
            { num: '14', cat: 'Preferences', q: 'Which industries interest you?', a: fmtList(raw.target_sectors) },
            { num: '15', cat: 'Preferences', q: 'Which business stages, locations & evidence interest you?', a: [fmtList(raw.target_stages), fmtList(raw.locations), fmtList(raw.expected_evidence || profile?.expected_evidence)].filter(Boolean).join(' · ') },
          ];

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {rows.map((r) => (
                <div key={r.num} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {r.num} · {r.cat}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#4c5262', marginBottom: '6px' }}>{r.q}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29' }}>
                    {r.a ? String(r.a) : <span style={{ color: '#9ca3af', fontWeight: 400 }}>Not answered yet</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
