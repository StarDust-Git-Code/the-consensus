import { Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useUiStore } from '../integration/store/uiStore';
import { DEFAULT_MODELS } from '../core/llm/constants';

interface BYOKModalProps {
  onClose: () => void;
}

const STORAGE_KEY = 'byok-config';

/** Mask an API key for display: show first 8 and last 4 chars */
const maskKey = (key: string) => {
  if (key.length <= 12) return '•'.repeat(key.length);
  return key.slice(0, 8) + '•'.repeat(Math.max(key.length - 12, 4)) + key.slice(-4);
};

const BYOKModal: React.FC<BYOKModalProps> = ({ onClose }) => {
  const { llmConfig, setLlmConfig, byokError } = useUiStore();

  const [apiKeys, setApiKeys] = useState<string[]>(
    llmConfig.apiKeys?.length ? [...llmConfig.apiKeys] : llmConfig.apiKey ? [llmConfig.apiKey] : []
  );
  const [newKey, setNewKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  const handleAddKey = () => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (apiKeys.includes(trimmed)) return; // No duplicates
    setApiKeys([...apiKeys, trimmed]);
    setNewKey('');
  };

  const handleRemoveKey = (index: number) => {
    setApiKeys(apiKeys.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const config = {
      apiKey: apiKeys[0] || '',     // Primary key (backward compat)
      apiKeys: apiKeys,              // All keys
      model: llmConfig.model || DEFAULT_MODELS.text,
    };
    setLlmConfig(config);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save BYOK config', e);
    }
    onClose();
  };

  const handleClearAll = () => {
    const emptyConfig = {
      apiKey: '',
      apiKeys: [],
      model: llmConfig.model || DEFAULT_MODELS.text,
    };
    setApiKeys([]);
    setNewKey('');
    setLlmConfig(emptyConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyConfig));
    } catch (e) {
      console.error('Failed to clear BYOK config', e);
    }
  };

  const toggleShowKey = (index: number) => {
    setShowKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 pointer-events-auto overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
      />
      <div
        className="relative w-full max-w-md rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] p-8 md:p-10 border"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-300 hover:text-zinc-600 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
              API Keys
            </h2>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener"
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 mb-3 border"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Get Gemini API Key</span>
              <svg className="text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[280px]">
              Add multiple API keys to multiply your daily request budget. Each key adds its own RPD quota.
            </p>
          </div>

          {/* Error Message */}
          {byokError && (() => {
            const isLongError = byokError.length > 120;
            const displayError = isErrorExpanded || !isLongError ? byokError : byokError.slice(0, 110) + '...';

            return (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="mt-0.5 text-red-500 shrink-0">
                  <X size={14} strokeWidth={3} className="rotate-45" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-0.5">API Error</p>
                  <div className={`${isErrorExpanded ? 'max-h-48' : 'max-h-24'} overflow-y-auto pr-1`}>
                    <p className="text-[11px] font-medium text-red-600 leading-tight break-words whitespace-pre-wrap">
                      {displayError}
                    </p>
                    {isLongError && (
                      <button
                        onClick={() => setIsErrorExpanded(!isErrorExpanded)}
                        className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                      >
                        {isErrorExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Existing Keys List */}
          {apiKeys.length > 0 && (
            <div className="mb-6">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-3 ml-1">
                Active Keys ({apiKeys.length})
              </label>
              <div className="space-y-2">
                {apiKeys.map((key, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 border rounded-2xl px-4 py-3 group hover:border-zinc-500 transition-colors"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        #{idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-xs font-mono text-zinc-500 truncate">
                      {showKeys[idx] ? key : maskKey(key)}
                    </span>
                    <button
                      onClick={() => toggleShowKey(idx)}
                      className="text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer p-1"
                    >
                      {showKeys[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleRemoveKey(idx)}
                      className="text-zinc-300 hover:text-red-400 transition-colors cursor-pointer p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* RPD multiplier badge */}
              {apiKeys.length > 1 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 border rounded-xl" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                  <span className="text-[10px] font-black text-violet-600">
                    {apiKeys.length}× RPD MULTIPLIER
                  </span>
                  <span className="text-[10px] text-violet-400">
                    — {apiKeys.length * 1500} RPD for Gemma, {apiKeys.length * 500} for Flash Lite
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Add New Key */}
          <div className="mb-10">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-4 ml-1">
              {apiKeys.length > 0 ? 'Add Another Key' : 'API Key'}
            </label>
            <div className="relative group flex gap-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                placeholder="Paste your API key here"
                className="flex-1 border rounded-3xl px-6 py-4 text-sm font-mono placeholder:text-zinc-500 placeholder:font-sans focus:outline-none focus:border-zinc-500 transition-all shadow-sm group-hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleAddKey}
                disabled={!newKey.trim()}
                className="px-5 py-4 rounded-3xl transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shrink-0 hover:opacity-80"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-elevated)' }}
                title="Add key"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleClearAll}
              disabled={apiKeys.length === 0 && !newKey}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <div className="p-2 rounded-xl group-hover:bg-red-50 transition-colors">
                <Trash2 size={16} strokeWidth={2.5} />
              </div>
              Clear All
            </button>

            <button
              onClick={handleSave}
              disabled={apiKeys.length === 0 && !newKey.trim()}
              className="px-12 py-4 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-xl hover:opacity-80"
              style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-elevated)' }}
            >
              Save{apiKeys.length > 1 ? ` (${apiKeys.length} keys)` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYOKModal;
