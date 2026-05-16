import { Activity, Info, KeyRound, Maximize2, Settings, Network } from 'lucide-react';
import React, { useState } from 'react';
import packageJson from '../../package.json';
import { useCoreStore } from '../integration/store/coreStore';
import { useUiStore } from '../integration/store/uiStore';
import BYOKModal from './BYOKModal';
import InfoModal from './InfoModal';
import { QuotaDashboard } from './QuotaDashboard';

const version = packageJson.version;

const Header: React.FC = () => {
  const { llmConfig, isBYOKOpen, setBYOKOpen } = useUiStore();
  const { setViewMode } = useCoreStore();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showQuota, setShowQuota] = useState(false);
  const hasKey = !!(llmConfig.apiKey || (llmConfig.apiKeys && llmConfig.apiKeys.length > 0));
  const keyCount = llmConfig.apiKeys?.length || (llmConfig.apiKey ? 1 : 0);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 shrink-0 relative z-40" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      {/* Left: Project Title */}
      <div className="flex items-center min-w-0">
        <div className="flex items-center gap-3 bg-[#1c1c20] text-white px-4 h-10 rounded-xl shrink-0 border" style={{ borderColor: 'var(--border-subtle)' }}>
          <Network size={20} strokeWidth={2.5} className="text-zinc-300" />
          <div className="flex flex-col leading-none justify-center mt-[2px]">
            <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest leading-none">The</span>
            <span className="text-[15px] font-black tracking-wide leading-none mt-[-2px]">Consensus</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start mt-3 ml-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsInfoOpen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Info size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Global Controls */}
      <div className="flex items-center gap-3">

        <button
          onClick={() => setViewMode('design')}
          className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-all shadow-lg shadow-black/20 active:scale-95 cursor-pointer h-9 shrink-0 ml-1"
          title="Manage Teams"
        >
          <Settings size={14} className="group-hover:rotate-45 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-wider ml-1 hidden sm:inline">Manage Teams</span>
        </button>

        <div className="w-px h-4 bg-zinc-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuota(v => !v)}
            className={`transition-colors p-1 ${showQuota ? 'text-emerald-500' : 'text-zinc-400 hover:text-darkConsensus'}`}
            title="API Quota Dashboard"
          >
            <Activity size={16} />
          </button>
          <button
            onClick={handleFullscreen}
            className="text-zinc-400 hover:text-darkConsensus transition-colors p-1"
            title="Fullscreen Browser"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => setBYOKOpen(true)}
            className="relative text-zinc-400 hover:text-darkConsensus transition-colors p-1"
            title={`API Keys (${keyCount} active)`}
          >
            <KeyRound size={16} className={hasKey ? 'text-emerald-500 hover:text-emerald-600' : ''} />
            {hasKey && (
              <span className="absolute -top-0.5 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white leading-none px-0.5">
                {keyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showQuota && <QuotaDashboard onClose={() => setShowQuota(false)} />}

      {isInfoOpen && (
        <InfoModal key="info-modal" onClose={() => setIsInfoOpen(false)} />
      )}

      {isBYOKOpen && (
        <BYOKModal key="byok-modal" onClose={() => setBYOKOpen(false)} />
      )}
    </header>
  );
};

export default Header;
