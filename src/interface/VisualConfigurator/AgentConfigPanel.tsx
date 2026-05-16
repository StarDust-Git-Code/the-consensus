import { Cpu, Save, Target, Trash2, User, X, Check, Pipette, Zap, CircleUser } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { AgentNode, AgenticSystem, getAllCharacters } from '../../data/agents';
import { USER_COLOR, USER_COLOR_LIGHT, USER_COLOR_SOFT } from '../../theme/brand';
import { useCoreStore } from '../../integration/store/coreStore';
import { useTeamStore } from '../../integration/store/teamStore';
import { Avatar } from '../components/Avatar';
import { ColorPicker } from './ColorPicker';
import { InfoBubble } from '../components/InfoBubble';
import { getBrightness, MAX_BRIGHTNESS } from './colorUtils';

interface AgentConfigPanelProps {
  agent: AgentNode;
  system: AgenticSystem;
  onClose: (wasSaved: boolean) => void;
  onUpdate: (updatedAgent: AgentNode) => void;
  onRemove?: () => void;
  mode?: 'view' | 'edit';
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  agent,
  system: activeSystem,
  onClose,
  onUpdate,
  onRemove,
  mode = 'edit'
}) => {
  const isView = mode === 'view';
  const { availableModels } = useCoreStore();
  const { saveCustomSystem } = useTeamStore();

  const [editData, setEditData] = useState<AgentNode>(agent);
  const isUser = agent.index === 0;
  const isLead = agent.index === 1;

  useEffect(() => {
    setEditData(agent);
  }, [agent]);

  const updateDraft = (changes: Partial<AgentNode>) => {
    const newData = { ...editData, ...changes };
    setEditData(newData);
    onUpdate(newData);
  };

  const allCharacters = useMemo(() => getAllCharacters(activeSystem), [activeSystem]);


  const nameCollision = useMemo(() => {
    return allCharacters.some(c =>
      c.id !== agent.id && c.name.toLowerCase().trim() === editData.name.toLowerCase().trim()
    );
  }, [allCharacters, agent.id, editData.name]);

  const isValid = useMemo(() => {
    const brightness = getBrightness(editData.color);
    const isNameEmpty = editData.name.trim() === '';
    return brightness <= MAX_BRIGHTNESS && !nameCollision && !isNameEmpty;
  }, [editData.color, editData.name, nameCollision]);

  const handleSave = () => {
    if (!isValid) return;

    const oldId = agent.id;
    const newId = editData.id;

    // 1. Recursive update function
    const updateRecursive = (node: AgentNode): AgentNode => {
      // If this is the node being edited
      let updatedNode = node.id === agent.id ? { ...editData } : { ...node };


      // Recurse subagents
      if (updatedNode.subagents) {
        updatedNode.subagents = updatedNode.subagents.map(updateRecursive);
      }

      return updatedNode;
    };

    const newLeadAgent = updateRecursive(activeSystem.leadAgent);

    const updatedSystem: AgenticSystem = {
      ...activeSystem,
      leadAgent: newLeadAgent,
    };

    saveCustomSystem(updatedSystem);
    onClose(true); // SAVED
  };

  const handleNameChange = (name: string) => {
    // Limit to letters, numbers and spaces
    const sanitizedName = name.replace(/[^a-zA-Z0-9 ]/g, '');
    updateDraft({ name: sanitizedName });
  };


  const renderField = (label: string, icon: React.ReactNode, value: React.ReactNode, helpText?: string, inline?: boolean) => (
    <div className={inline ? "flex items-center justify-between" : "space-y-1.5"}>
      <div className="flex items-center gap-1.5">
        {icon && <div className="text-zinc-400 shrink-0">{icon}</div>}
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">{label}</label>
        {helpText && <InfoBubble text={helpText} />}
      </div>
      <div className={inline ? "" : "px-1"}>{value}</div>
    </div>
  );

  return (
    <div className="w-80 h-full flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-right-full duration-300 border-l" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          {isUser ? (
            <Avatar type="user" color={USER_COLOR} size={32} />
          ) : (
            <Avatar type={isLead ? 'lead' : 'sub'} color={editData.color} size={32} />
          )}
          <h3 className="font-bold text-sm uppercase tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {isUser ? 'User Info' : (isLead ? 'Lead Agent Info' : 'Subagent Info')}
          </h3>
        </div>
        <button onClick={() => onClose(false)} className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {isUser ? (
          <div
            className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-3xl border italic"
            style={{ backgroundColor: USER_COLOR_LIGHT, borderColor: USER_COLOR_SOFT }}
          >
            <div
              className="p-1 rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: 'transparent', boxShadow: `0 10px 15px -3px ${USER_COLOR}33` }}
            >
              <Avatar type="user" color={USER_COLOR} size={64} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Primary User</h4>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>This is you. Your identity and role are fixed across all teams for consistency.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Identity Group */}
            <div className="space-y-6">
              {!isView && (
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <Pipette size={12} className="text-zinc-400" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Agent Color</label>
                  </div>
                  <ColorPicker
                    color={editData.color}
                    onChange={(val) => updateDraft({ color: val })}
                  />
                </div>
              )}

              {renderField('Name', <CircleUser size={12} />, isView ? (
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{editData.name}</p>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-bold focus:outline-none transition-colors ${nameCollision ? 'border-red-500 text-red-600' : ''}`}
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: nameCollision ? '' : 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                  {nameCollision && (
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-tight px-1">
                      This name is already used in the team
                    </p>
                  )}
                </div>
              ), 'Limit characters to letters, numbers and spaces. The ID is auto-generated.')}

              {renderField('LLM Model', <Cpu size={12} />, isView ? (
                <div className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-mono w-fit lowercase" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  {editData.model || 'gemma-4-31b-it'}
                </div>
              ) : (
                <div className="w-full space-y-2">
                  <select
                    value={availableModels.includes(editData.model || 'gemma-4-31b-it') ? (editData.model || 'gemma-4-31b-it') : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        updateDraft({ model: '' });
                      } else {
                        updateDraft({ model: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none cursor-pointer lowercase transition-colors"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {availableModels.map(m => <option key={m} value={m} className="lowercase">{m}</option>)}
                    <option value="custom" className="font-bold text-zinc-400">Custom Model...</option>
                  </select>
                  
                  {!availableModels.includes(editData.model || 'gemma-4-31b-it') && (
                    <input
                      type="text"
                      value={editData.model || ''}
                      onChange={(e) => updateDraft({ model: e.target.value })}
                      placeholder="e.g. gemini-1.5-pro"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none lowercase transition-colors animate-in fade-in slide-in-from-top-2"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: USER_COLOR_SOFT, color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  )}
                </div>
              ), 'The specific Gemini model this agent will use.')}
            </div>

            {/* Content Group */}
            <div className="space-y-6">
              {renderField('Description', <Target size={12} />, isView ? (
                <div className="p-4 rounded-xl border min-h-[120px]" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium italic" style={{ color: 'var(--text-secondary)' }}>
                    {editData.description || "No description provided."}
                  </p>
                </div>
              ) : (
                <textarea
                  value={editData.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  className="w-full h-48 px-3 py-2 border rounded-xl text-xs leading-relaxed focus:outline-none resize-none font-medium transition-colors"
                  placeholder="What is this agent specialized in? What are its primary goals and constraints?"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              ), 'A concise yet comprehensive definition of the agent\'s role, expertise, and operational guidelines.')}
            </div>


            {/* Capabilities & Controls */}
            <div className="space-y-6">
              {renderField('Capabilities', <Zap size={12} />, (
                <div className="border rounded-2xl p-4 gap-y-3 flex flex-col" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                  {isLead && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <Check size={10} style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Set Project Brief</span>
                    </div>
                  )}
                  {(editData.subagents?.length || 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <Check size={10} style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Propose Tasks</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <Check size={10} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Execute & Complete Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <Check size={10} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Autonomous Reasoning</span>
                  </div>
                  {isLead && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <Check size={10} style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Deliver Project</span>
                    </div>
                  )}
                </div>
              ), "Tools are automatically assigned based on the agent's role and team hierarchy.")}

              {renderField('Supervision', <User size={12} />, (
                <div
                  onClick={() => !isView && updateDraft({ humanInTheLoop: !editData.humanInTheLoop })}
                  className={`
                      group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200
                      ${editData.humanInTheLoop ? 'shadow-sm' : 'hover:border-zinc-700'}
                      ${isView ? 'pointer-events-none' : 'cursor-pointer active:scale-[0.98]'}
                    `}
                  style={{
                    backgroundColor: editData.humanInTheLoop ? USER_COLOR_LIGHT : 'var(--bg-elevated)',
                    borderColor: editData.humanInTheLoop ? USER_COLOR_SOFT : 'var(--border-subtle)'
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-tight"
                      style={{ color: editData.humanInTheLoop ? USER_COLOR : 'var(--text-primary)' }}
                    >
                      Human-in-the-loop
                    </span>
                    <span className="text-[9px] font-medium leading-tight max-w-[160px]" style={{ color: editData.humanInTheLoop ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      Agent must request your validation before completing any task.
                    </span>
                  </div>
                  <div className={`
                      w-8 h-4 rounded-full relative transition-colors duration-200
                      ${editData.humanInTheLoop ? '' : 'bg-zinc-700'}
                    `}
                    style={{ backgroundColor: editData.humanInTheLoop ? USER_COLOR : undefined }}
                  >
                    <div className={`
                        absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-sm
                        ${editData.humanInTheLoop ? 'translate-x-4.5' : 'translate-x-0.5'}
                      `} />
                  </div>
                </div>
              ), "When enabled, the agent will pause their work to submit the result for your review and feedback before finalizing.")}
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!isView && !isUser && (
        <div className="p-4 border-t flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/5 active:scale-95 ${!isValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <Save size={16} strokeWidth={2.5} />
            Update Agent
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="w-full py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={14} />
              Remove from Team
            </button>
          )}
        </div>
      )}
    </div>
  );
};
