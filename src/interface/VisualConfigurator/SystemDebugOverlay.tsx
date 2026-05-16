
import React, { useState } from 'react';
import { X, Code, Copy, Check } from 'lucide-react';

interface SystemDebugOverlayProps {
  system: any;
  onClose?: () => void;
}

export const SystemDebugOverlay: React.FC<SystemDebugOverlayProps> = ({ system, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(system, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 rounded border text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'rgb(248, 113, 113)',
          borderColor: 'rgba(239, 68, 68, 0.2)'
        }}
      >
        <Code size={10} />
        Debug System
      </button>

      {isOpen && (
        <div className="fixed inset-4 border shadow-2xl rounded-2xl z-[1000] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <Code size={14} style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                System Debug Data — <span style={{ color: 'var(--text-primary)' }}>{system.teamName || 'Untitled'}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 border rounded-lg text-[9px] font-bold transition-all active:scale-95"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 px-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                title="Close overlay"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <pre className="flex-1 overflow-auto p-6 text-[11px] font-mono whitespace-pre-wrap text-green-400 selection:bg-green-500/20" style={{ backgroundColor: 'var(--bg-surface)' }}>
            {JSON.stringify(system, null, 2)}
          </pre>

          <div className="p-3 border-t flex justify-end" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <p className="text-[8px] font-bold uppercase tracking-widest italic" style={{ color: 'var(--text-muted)' }}>
              Provisional Debug Tool • Close with ESC or button
            </p>
          </div>
        </div>
      )}
    </>
  );
};
