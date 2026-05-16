import { Info, RefreshCcw, ScrollText, FileText, Image, Music, Video } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { getAgentSet, getAllAgents } from '../data/agents';
import { useCoreStore } from '../integration/store/coreStore';
import { useTeamStore, useActiveTeam } from '../integration/store/teamStore';
import { useSceneManager } from '../simulation/SceneContext';
import { USER_COLOR } from '../theme/brand';
import ResetModal from './ResetModal';

export function formatTokens(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

const ProjectView: React.FC = () => {
  const {
    userBrief,
    referenceImages,
    phase,
    actionLog,
    resetProject,
  } = useCoreStore();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const activeTeam = useActiveTeam();
  const scene = useSceneManager();

  const hasLogs = actionLog.length > 0;

  const handleResetConfirm = () => {
    // 1. Reset the 3D scene (teleport agents, clear chat)
    scene?.resetScene();
    // 3. Clear project state
    resetProject();
    setIsResetModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>Project Info</h2>
          <div className="flex items-center gap-2">
            <div
              className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors border border-transparent"
              style={{
                backgroundColor: phase === 'working' ? USER_COLOR : (phase === 'done' ? '#22c55e' : 'var(--bg-elevated)'),
                color: phase === 'idle' ? 'var(--text-secondary)' : 'white',
                borderColor: phase === 'idle' ? 'var(--border-subtle)' : 'transparent'
              }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${phase === 'working' ? 'bg-white animate-pulse' : 'bg-zinc-500'}`} />
              {phase === 'idle' ? 'Ready to Start' : phase}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full mb-6" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Reset Project Button */}
      {hasLogs && (
        <div className="mb-8 w-full">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl transition-all active:scale-[0.98] group ${phase === 'done'
                ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 shadow-xl'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
            style={phase !== 'done' ? { backgroundColor: 'var(--bg-card)', borderColor: undefined } : undefined}
          >
            <RefreshCcw size={14} strokeWidth={3} className="transition-transform group-hover:rotate-180 duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Start New Project</span>
          </button>
        </div>
      )}

      {/* Brief */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">User Brief</p>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
        </div>
        {userBrief ? (
          <div className="space-y-4">
            <div className="markdown-content text-xs leading-relaxed font-medium p-4 rounded-xl border max-h-[300px] overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <ReactMarkdown>
                {userBrief}
              </ReactMarkdown>
            </div>

            {(activeTeam.outputType === 'image' || activeTeam.outputType === 'video') && referenceImages.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Brief Logic References</p>
                <div className="grid grid-cols-3 gap-2">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
                      <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No active brief. Talk to the Lead Agent to define your project.</p>
        )}
      </div>



      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
      />


    </div>
  );
};

export default ProjectView;
