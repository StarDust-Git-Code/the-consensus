import { Background, Edge, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgenticSystem, getAllAgents, getAllCharacters } from '../data/agents';
import { DirectionalEdge } from './VisualConfigurator/edges/DirectionalEdge';
import { VisualFlowNode } from './VisualConfigurator/nodes/VisualFlowNode';
import { systemToFlow, VisualAgentNode } from './VisualConfigurator/flowUtils';
import { useFlowFocus } from './VisualConfigurator/hooks/useFlowFocus';
import { TeamBadge } from './components/TeamBadge';
import { TeamOutputBadge } from './components/TeamOutputBadge';

const nodeTypes = {
  agent: VisualFlowNode,
  user: VisualFlowNode,
};

const edgeTypes = {
  default: DirectionalEdge,
  hierarchy: DirectionalEdge,
  smoothstep: DirectionalEdge,
};

interface TeamFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: AgenticSystem;
}

const FlowViewport: React.FC<{ system: AgenticSystem }> = ({ system }) => {
  const { fitView } = useReactFlow();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => systemToFlow(system), [system]);

  const [nodes] = useState<VisualAgentNode[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);

  // Focus lead agent by default
  const { nodesWithFocus, edgesWithFocus } = useFlowFocus(nodes, edges, null, system.leadAgent.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodesWithFocus}
      edges={edgesWithFocus}
      nodeTypes={nodeTypes as any}
      edgeTypes={edgeTypes as any}
      nodeOrigin={[0.5, 0]}
      fitView
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      nodesDraggable={false}
      elementsSelectable={false}
      zoomOnScroll={true}
      maxZoom={1.5}
      minZoom={0.2}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <Background gap={24} color="#3f3f46" size={2} />
    </ReactFlow>
  );
};

const TeamFlowModal: React.FC<TeamFlowModalProps> = ({ isOpen, onClose, system }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Resilience check: only clear task if not waiting for review or meeting */}
      {/* Modal Content */}
      <div className="relative w-full h-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col pointer-events-auto animate-in zoom-in-95 fade-in duration-300 ease-out" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        {/* Header */}
        <div className="h-16 border-b flex items-center justify-between px-6 shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-4">
            <TeamBadge system={system} />
            <TeamOutputBadge system={system} className="hidden sm:flex" />
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors group"
          >
            <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-200" />
          </button>
        </div>

        {/* Flow Area */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <FlowViewport system={system} />
          </ReactFlowProvider>
        </div>

        {/* Footer/Legend */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-6 overflow-x-auto shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: 'var(--text-muted)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Hierarchy (Managed)</span>
            </div>
          </div>

          <p className="text-[10px] font-medium italic" style={{ color: 'var(--text-muted)' }}>
            Visual representation of the team's operational flow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamFlowModal;
