import React, { useState, useMemo } from 'react';
import { VentureCard as IVentureCard, User } from '../../shared/types';
import { VentureCard } from '../../components/VentureCard';

interface InvestorDashboardProps {
  ventures: IVentureCard[];
  currentUser: User | null;
  onSelectVenture: (venture: IVentureCard) => void;
  onRequestConnect: (venture: IVentureCard) => void;
  onOpenChat: (connectionId: string) => void;
  onOpenLogin: () => void;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({
  ventures,
  currentUser,
  onSelectVenture,
  onRequestConnect,
  onOpenChat,
  onOpenLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Extract unique sectors and stages
  const sectors = useMemo(() => {
    const set = new Set<string>();
    ventures.forEach((v) => {
      if (v.sector) set.add(v.sector);
    });
    return Array.from(set);
  }, [ventures]);

  const stages = useMemo(() => {
    const set = new Set<string>();
    ventures.forEach((v) => {
      if (v.stage) set.add(v.stage);
    });
    return Array.from(set);
  }, [ventures]);

  // Filtered list
  const filteredVentures = useMemo(() => {
    return ventures.filter((v) => {
      const matchesSearch =
        searchTerm === '' ||
        v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.tag_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSector =
        selectedSector === 'ALL' || v.sector.toLowerCase() === selectedSector.toLowerCase();

      const matchesStage =
        selectedStage === 'ALL' || v.stage.toLowerCase() === selectedStage.toLowerCase();

      return matchesSearch && matchesSector && matchesStage;
    });
  }, [ventures, searchTerm, selectedSector, selectedStage]);

  const connectedCount = ventures.filter((v) => v.connection_status === 'CONNECTED').length;
  const pendingCount = ventures.filter((v) => v.connection_status === 'REQUESTED').length;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 80px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div className="eyebrow">CURATED DIRECTORY</div>
          <h1 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginTop: '4px', marginBottom: '8px' }}>
            Verified Indian Ventures
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '640px' }}>
            Browse investment-ready companies with audited traction, customer references, and MCA legal verification.
            Request a connection to unlock private 1-on-1 dialogue with the founders.
          </p>
        </div>

        {/* Stats Pill */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            padding: '14px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bg-dark)' }}>
              {ventures.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Vetted Deals
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-light)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-green)' }}>
              {connectedCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Connected
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-light)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-gold)' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Search input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by company, sector, keyword, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              fontSize: '14px',
              background: '#fcfaf6',
              outline: 'none',
            }}
          />
          <svg
            style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ba3af' }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* Sector filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Sector:</label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              background: '#ffffff',
              fontSize: '13.5px',
              color: 'var(--bg-dark)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Sectors ({ventures.length})</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Stage filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Stage:</label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              background: '#ffffff',
              fontSize: '13.5px',
              color: 'var(--bg-dark)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Stages</option>
            {stages.map((stg) => (
              <option key={stg} value={stg}>
                {stg}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || selectedSector !== 'ALL' || selectedStage !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSector('ALL');
              setSelectedStage('ALL');
            }}
            style={{
              padding: '8px 12px',
              background: '#f2eae0',
              border: '1px solid #d8cab2',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--bg-dark)',
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Cards Grid */}
      {filteredVentures.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '28px',
          }}
        >
          {filteredVentures.map((venture) => (
            <VentureCard
              key={venture.id}
              venture={venture}
              onSelect={onSelectVenture}
              onRequestConnection={(v: IVentureCard) => {
                if (!currentUser) {
                  onOpenLogin();
                } else {
                  onRequestConnect(v);
                }
              }}
              onOpenChat={onOpenChat}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 20px',
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '20px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
            No ventures match your criteria
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Try clearing search keywords or selecting different stage and sector filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSector('ALL');
              setSelectedStage('ALL');
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              background: 'var(--bg-dark)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
