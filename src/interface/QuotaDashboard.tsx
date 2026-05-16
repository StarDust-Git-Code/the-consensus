import React, { useState, useEffect } from 'react';
import { Activity, X, RotateCcw } from 'lucide-react';
import { ModelRouter } from '../core/llm/modelRouter';

export const QuotaDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stats, setStats] = useState(ModelRouter.getUsageStats());

  useEffect(() => {
    const interval = setInterval(() => setStats(ModelRouter.getUsageStats()), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-12 right-4 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
            API Quota
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { ModelRouter.resetCounts(); setStats(ModelRouter.getUsageStats()); }}
            className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Reset counters"
          >
            <RotateCcw size={14} />
          </button>
          <button onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {stats.map(s => (
          <div key={s.model} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono lowercase truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>
                {s.model}
              </span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {s.used}/{s.limit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(s.percent, 100)}%`,
                  backgroundColor: s.percent > 80 ? '#EF4444'
                                  : s.percent > 50 ? '#F59E0B' : '#22C55E'
                }}
              />
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <p className="text-xs text-center py-4 italic" style={{ color: 'var(--text-muted)' }}>
            No requests yet today
          </p>
        )}
      </div>
      <div className="px-4 py-2 border-t" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <p className="text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>
          Resets at midnight PT • Chat uses Live API (∞)
          {ModelRouter.getKeyCount() > 1 && (
            <span className="text-violet-500 font-bold"> • {ModelRouter.getKeyCount()} keys active ({ModelRouter.getKeyCount()}× RPD)</span>
          )}
        </p>
      </div>
    </div>
  );
};
