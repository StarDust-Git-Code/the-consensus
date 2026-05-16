import React from 'react';
import { getAgentSet, getAllAgents, getAllCharacters } from '../data/agents';
import { useCoreStore } from '../integration/store/coreStore';
import { useTeamStore, useActiveTeam } from '../integration/store/teamStore';
import { Avatar } from './components/Avatar';

import { formatTokens } from './ProjectView';

interface AgentStatusPanelProps {
  agentIndex: number;
}

const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ agentIndex }) => {
  const { tasks } = useCoreStore();
  const system = useActiveTeam();
  const agents = getAllAgents(system);

  const agent = agents.find(a => a.index === agentIndex);
  if (!agent) return null;

  const activeTask = tasks.find(
    (t) => t.assignedAgentId === agentIndex && t.status === 'in_progress'
  ) ?? null;

  const usage = useCoreStore.getState().agentTokenUsage[agentIndex] || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Agent Info */}
      <div className="mb-8 space-y-6">
        {/* Role/Description */}
        {agent.index !== 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Description</p>
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
            </div>
            <p className="text-xs leading-relaxed font-medium capitalize-first" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
          </div>
        )}
        {/* Model */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Model</p>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <p className="text-[11px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              {agent.model}
            </p>
          </div>
        </div>
        {/* Token Usage */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Token Usage</p>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold font-mono">
            <span style={{ color: 'var(--text-primary)' }}>{formatTokens(usage.promptTokens)} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>input</span></span>
            <span style={{ color: 'var(--text-dimmed)' }}>+</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatTokens(usage.completionTokens)} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>output</span></span>
          </div>
        </div>
      </div>

      <div className="h-px w-full mb-6" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Task Status */}
      {activeTask ? (
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: agent.color }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: agent.color }}></span>
            </span>
            Doing Now
          </p>
          <p className="text-sm leading-snug font-bold" style={{ color: 'var(--text-primary)' }}>
            "{activeTask.title}"
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-dimmed)' }}>
            Status
          </p>
          <p className="text-sm leading-snug italic font-medium" style={{ color: 'var(--text-muted)' }}>
            Waiting for next task...
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentStatusPanel;
