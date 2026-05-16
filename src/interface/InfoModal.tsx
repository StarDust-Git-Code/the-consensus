import React from 'react';
import { X, Network } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 pointer-events-auto overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500"
      />
      <div
        className="relative w-full max-w-xl rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] p-8 md:p-10 border animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Close Button X */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 rounded-full transition-all active:scale-95 cursor-pointer"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-inner">
              <Network size={32} strokeWidth={2} className="text-zinc-300" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-darkConsensus leading-[1.2] mb-6 tracking-tight text-center">
            A no-code 3D playground to explore Agentic AI systems
          </h2>

          <div className="space-y-6 text-zinc-500 text-[15px] leading-relaxed text-center sm:text-left">
            <p>
              The Consensus is an experimental workspace where you stop prompting and start delegating to a team of autonomous AI agents in a living 3D office.
            </p>
            <p>
              Designed for enthusiasts, educators, and creative developers to understand multi-agent collaboration, making complex AI processes transparent, collaborative, and human-centered.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InfoModal;


