import { Check, ChevronDown, ChevronRight, Copy, Download, Eye, Filter, MessageSquare, Terminal, Zap } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { getAgentSet, getAllAgents } from '../data/agents'
import { USER_COLOR, USER_COLOR_LIGHT } from '../theme/brand'
import { DebugLogEntry, useCoreStore } from '../integration/store/coreStore'
import { useTeamStore, useActiveTeam } from '../integration/store/teamStore'
import { formatTokens } from './ProjectView'

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1 rounded transition-all cursor-pointer ${copied ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            title="Copy to clipboard"
        >
            {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
    );
};

const DebugEntryView: React.FC<{ entry: DebugLogEntry }> = ({ entry }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeTeam = useActiveTeam();
    const agents = getAllAgents(activeTeam);
    const agent = entry.agentIndex === -1
        ? { name: 'System', color: '#71717a' }
        : agents.find(a => a.index === entry.agentIndex);

    const totalTools = entry.phase === 'request'
        ? entry.systemTools?.reduce((acc: number, t: any) => acc + (t.functionDeclarations?.length || 0), 0) || 0
        : 0;

    const fullContent = `
AGENT: ${agent?.name} (${entry.phase})
TIME: ${formatTime(entry.timestamp)}
PHASE: ${entry.phase}

${entry.phase === 'request' ? `
SYSTEM INSTRUCTION:
${entry.systemInstruction || 'None'}

USER BRIEF / MESSAGES:
${JSON.stringify(entry.contents, null, 2)}
` : `
CONTENT:
${entry.content || 'None'}

RAW RESPONSE:
${JSON.stringify(entry.raw, null, 2)}
`}
    `.trim();

    return (
        <div className="border-b last:border-0 py-3 group" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1 mb-1 pr-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between text-left hover:bg-zinc-800/50 rounded p-1 transition-colors cursor-pointer"
                >
                    <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between w-full overflow-hidden">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agent?.color ?? '#ccc' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate" style={{ color: 'var(--text-primary)' }}>
                                        {agent?.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-4">
                                    <span
                                        className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap"
                                        style={entry.phase === 'request' ? {
                                            backgroundColor: USER_COLOR_LIGHT,
                                            color: USER_COLOR
                                        } : {
                                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                            color: '#34d399'
                                        }}
                                    >
                                        {entry.phase}
                                    </span>
                                    {entry.phase === 'response' && entry.usage && (
                                        <span className="text-[8px] font-mono font-bold text-zinc-400 border px-1 py-0.5 rounded leading-none whitespace-nowrap" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                                            T: {formatTokens(entry.usage.totalTokens)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
                                <span className="text-[8px] font-mono text-zinc-400">{formatTime(entry.timestamp)}</span>
                                {isOpen ? <ChevronDown size={12} className="text-zinc-300" /> : <ChevronRight size={12} className="text-zinc-300" />}
                            </div>
                        </div>

                        {/* Summary of tool calls in preview */}
                        {entry.phase === 'response' && entry.tool_calls && entry.tool_calls.length > 0 && !isOpen && (
                            <div className="flex flex-wrap gap-1 pl-4">
                                {entry.tool_calls.map((tc, i) => (
                                    <span key={i} className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 border px-1.5 py-0.5 rounded shadow-sm" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
                                        <Zap size={8} />
                                        {tc.function?.name || '(unknown)'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </button>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={fullContent} />
                </div>
            </div>

            {isOpen && (
                <div className="mt-2 space-y-2 pl-4 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
                    {entry.phase === 'request' ? (
                        <>
                            {/* System Instruction — collapsed by default */}
                            {entry.systemInstruction && (
                                <details className="group/sp">
                                    <summary className="flex items-center justify-between gap-1.5 py-1 cursor-pointer list-none">
                                        <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                                            <ChevronRight size={10} className="text-zinc-400 group-open/sp:rotate-90 transition-transform" />
                                            <Terminal size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">System Instruction</span>
                                        </div>
                                        <div onClick={e => e.stopPropagation()}>
                                            <CopyButton text={entry.systemInstruction} />
                                        </div>
                                    </summary>
                                    <pre className="mt-1.5 text-[10px] p-2 rounded leading-relaxed whitespace-pre-wrap font-mono border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                                        {entry.systemInstruction}
                                    </pre>
                                </details>
                            )}

                            {/* Tools — collapsed by default */}
                            <details className={`group/tools ${totalTools === 0 ? 'pointer-events-none' : ''}`}>
                                <summary className="flex items-center justify-between gap-1.5 py-1 cursor-pointer list-none">
                                    <div className={`flex items-center gap-1.5 ${totalTools === 0 ? 'opacity-20' : 'opacity-50 hover:opacity-100 transition-opacity'}`}>
                                        <ChevronRight size={10} className={`text-zinc-400 group-open/tools:rotate-90 transition-transform ${totalTools === 0 ? 'invisible' : ''}`} />
                                        <Zap size={10} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">System Tools ({totalTools})</span>
                                    </div>
                                    {totalTools > 0 && (
                                        <div onClick={e => e.stopPropagation()}>
                                            <CopyButton text={JSON.stringify(entry.systemTools, null, 2)} />
                                        </div>
                                    )}
                                </summary>
                                {totalTools > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1 p-2 rounded border" style={{ backgroundColor: 'rgba(5, 150, 105, 0.05)', borderColor: 'rgba(5, 150, 105, 0.15)' }}>
                                        {entry.systemTools.map((toolGroup, i) => (
                                            <React.Fragment key={i}>
                                                {toolGroup.functionDeclarations?.map((fd: any, j: number) => (
                                                    <span key={j} className="text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded border shadow-xs" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
                                                        {fd.name}
                                                    </span>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </details>

                            {/* Contents Array — collapsed by default */}
                            {entry.contents && entry.contents.length > 0 && (
                                <details className="group/msgs" open>
                                    <summary className="flex items-center justify-between gap-1.5 py-1 cursor-pointer list-none">
                                        <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                                            <ChevronRight size={10} className="text-zinc-400 group-open/msgs:rotate-90 transition-transform" />
                                            <MessageSquare size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Contents / Messages ({entry.contents.length})</span>
                                        </div>
                                        <div onClick={e => e.stopPropagation()}>
                                            <CopyButton text={JSON.stringify(entry.contents, null, 2)} />
                                        </div>
                                    </summary>
                                    <div className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-1 customize-scrollbar border-l-2 border-zinc-50 pl-2">
                                        {entry.contents.map((m, i) => (
                                            <div key={i} className={`p-2 rounded border group/msg transition-all ${m.role === 'user' ? 'border-zinc-700' :
                                                'border-emerald-800/30'
                                                }`} style={{ backgroundColor: m.role === 'user' ? 'var(--bg-card)' : 'rgba(5, 150, 105, 0.05)' }}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-zinc-400' :
                                                        'text-emerald-600'
                                                        }`}>{m.role}</span>
                                                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                        <CopyButton text={JSON.stringify(m, null, 2)} />
                                                    </div>
                                                </div>
                                                <div className="mt-1.5 space-y-2">
                                                    {/* Standard content (string) support */}
                                                    {m.content && (
                                                        <div className="text-[10px] leading-relaxed font-sans whitespace-pre-wrap py-1" style={{ color: 'var(--text-secondary)' }}>
                                                            {m.content}
                                                        </div>
                                                    )}

                                                    {/* Standard tool_calls support */}
                                                    {m.tool_calls && m.tool_calls.length > 0 && (
                                                        <div className="space-y-2 mt-2">
                                                            {m.tool_calls.map((tc: any, idx: number) => (
                                                                <div key={idx} className="bg-darkConsensus rounded-lg overflow-hidden border border-darkConsensus shadow-lg">
                                                                    <div className="bg-darkConsensus px-2.5 py-1.5 flex items-center justify-between">
                                                                        <span className="text-[9px] font-black text-emerald-400 font-mono tracking-wider">{tc.function?.name}</span>
                                                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Call</span>
                                                                    </div>
                                                                    <div className="p-2.5 bg-darkConsensus/50">
                                                                        <pre className="text-[9px] text-zinc-300 font-mono wrap-break-word whitespace-pre-wrap">
                                                                            {tc.function?.arguments}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="pt-2">
                                <div className="flex items-center justify-between gap-1.5 mb-1.5 opacity-50">
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare size={10} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Response Details</span>
                                    </div>
                                    <CopyButton text={entry.content || ''} />
                                </div>
                                <div className="space-y-3">
                                    {/* Formatted Text Content */}
                                    {entry.content && (
                                        <div className="text-[11px] p-3 rounded leading-relaxed border shadow-sm relative italic whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                                            <div className="absolute -top-2 left-2 px-1 text-[8px] font-black uppercase text-zinc-500 border rounded" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>Text</div>
                                            {entry.content}
                                        </div>
                                    )}

                                    {/* Formatted Tool Calls */}
                                    {entry.tool_calls && entry.tool_calls.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 ml-1">
                                                <Zap size={10} className="text-emerald-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Tool calls</span>
                                            </div>
                                            {entry.tool_calls.map((tc, i) => {
                                                const name = tc.function?.name || '(unknown)';
                                                let args: Record<string, unknown> | null = null;
                                                try { args = JSON.parse(tc.function?.arguments ?? '{}'); } catch { args = (tc as any).args ?? null; }
                                                return (
                                                    <div key={i} className="bg-darkConsensus rounded-lg overflow-hidden border border-darkConsensus shadow-lg">
                                                        <div className="bg-darkConsensus px-2.5 py-1.5 flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-emerald-400 font-mono tracking-wider">{name}</span>
                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Arguments</span>
                                                        </div>
                                                        <div className="p-2.5 bg-darkConsensus/50">
                                                            {args && Object.keys(args).length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {Object.entries(args).map(([key, value]) => (
                                                                        <div key={key} className="flex flex-col gap-0.5">
                                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{key}</span>
                                                                            <div className="text-[9px] text-zinc-300 font-mono bg-darkConsensus/50 p-1.5 rounded border border-zinc-700/50 wrap-break-word whitespace-pre-wrap">
                                                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] text-zinc-500 italic">No arguments</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Raw LLM Response — collapsed by default */}
                            {entry.raw && (
                                <details className="group/raw">
                                    <summary className="flex items-center justify-between gap-1.5 py-1 cursor-pointer list-none">
                                        <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                                            <ChevronRight size={10} className="text-zinc-400 group-open/raw:rotate-90 transition-transform" />
                                            <Download size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Raw LLM Response</span>
                                        </div>
                                        <div onClick={e => e.stopPropagation()}>
                                            <CopyButton text={JSON.stringify(entry.raw, null, 2)} />
                                        </div>
                                    </summary>
                                    <pre className="mt-1.5 text-[9px] bg-darkConsensus text-zinc-400 p-2 rounded leading-relaxed whitespace-pre overflow-x-auto font-mono border border-darkConsensus">
                                        {JSON.stringify(entry.raw, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export function ActionLogPanel() {
    const { setLogOpen, actionLog, debugLog, logFilterAgentIndex } = useCoreStore()
    const activeTeam = useActiveTeam();
    const agents = getAllAgents(activeTeam);
    const [activeTab, setActiveTab] = useState<'activity' | 'technical'>('technical')
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
    const topRef = useRef<HTMLDivElement>(null)

    const handleDownloadAll = () => {
        const content = debugLog.map(entry => {
            const agent = entry.agentIndex === -1
                ? { name: 'System' }
                : agents.find(a => a.index === entry.agentIndex);
            return `
=========================================
AGENT: ${agent?.name} (${entry.phase})
TIME: ${new Date(entry.timestamp).toLocaleString()}
PHASE: ${entry.phase}
=========================================

${entry.phase === 'request' ? `
SYSTEM INSTRUCTION:
${entry.systemInstruction || 'None'}

USER BRIEF / MESSAGES:
${JSON.stringify(entry.contents, null, 2)}

SYSTEM TOOLS:
${JSON.stringify(entry.systemTools, null, 2)}
` : `
CONTENT:
${entry.content || 'None'}

TOOL CALLS:
${JSON.stringify(entry.tool_calls || [], null, 2)}

RAW RESPONSE:
${JSON.stringify(entry.raw, null, 2)}
`}
`.trim();
        }).join('\n\n\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `the-consensus-technical-logs-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Auto-scroll to top when a new log entry arrives (since order is reversed)
    useEffect(() => {
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, [actionLog, debugLog, activeTab])

    const filterAgent =
        logFilterAgentIndex !== null ? agents.find(a => a.index === logFilterAgentIndex) ?? null : null

    const entries =
        logFilterAgentIndex !== null
            ? actionLog.filter((e) => e.agentIndex === logFilterAgentIndex).reverse()
            : [...actionLog].reverse()

    const debugEntries =
        logFilterAgentIndex !== null
            ? debugLog.filter((e) => e.agentIndex === logFilterAgentIndex).reverse()
            : [...debugLog].reverse()

    return (
        <div className="w-[320px] h-full border-r flex flex-col pointer-events-auto overflow-hidden shrink-0 relative" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            {/* Header */}
            <div className="h-10 px-5 border-b flex items-center justify-between shrink-0 z-10" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Logs</span>
                    {filterAgent && (
                        <div
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-tighter animate-in fade-in zoom-in duration-200"
                            style={{ backgroundColor: filterAgent.color }}
                        >
                            {filterAgent.name}
                            <button
                                onClick={() => setLogOpen(true, null)}
                                className="hover:scale-110 transition-transform cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${isFilterMenuOpen || logFilterAgentIndex !== null
                                ? 'bg-zinc-700 text-zinc-200'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                }`}
                            title="Filter by agent"
                        >
                            <Filter size={14} />
                        </button>

                        {isFilterMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setIsFilterMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 border rounded-xl shadow-xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                                    <button
                                        onClick={() => {
                                            setLogOpen(true, null);
                                            setIsFilterMenuOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-colors ${logFilterAgentIndex === null ? 'text-zinc-200' : 'text-zinc-500'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${logFilterAgentIndex === null ? 'bg-zinc-200' : 'bg-transparent border border-zinc-600'}`} />
                                        All Agents
                                    </button>
                                    <div className="h-px my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                                    {agents.map((agent) => (
                                        <button
                                            key={agent.index}
                                            onClick={() => {
                                                setLogOpen(true, agent.index);
                                                setIsFilterMenuOpen(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-colors ${logFilterAgentIndex === agent.index ? 'text-zinc-200' : 'text-zinc-500'
                                                }`}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: agent.color }}
                                            />
                                            {agent.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {activeTab === 'technical' && debugEntries.length > 0 && (
                        <button
                            onClick={handleDownloadAll}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800 cursor-pointer"
                            title="Download all as .txt"
                        >
                            <Download size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-root)' }}>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'activity' ? 'border-b-2 border-zinc-400 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    style={activeTab === 'activity' ? { backgroundColor: 'var(--bg-surface)' } : undefined}
                >
                    Activity
                </button>
                <button
                    onClick={() => setActiveTab('technical')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'technical' ? 'border-b-2 border-zinc-400 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    style={activeTab === 'technical' ? { backgroundColor: 'var(--bg-surface)' } : undefined}
                >
                    Technical
                </button>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 shadow-[inset_0_-20px_20px_-20px_rgba(0,0,0,0.05)]">
                <div ref={topRef} />

                {activeTab === 'activity' ? (
                    entries.length === 0 ? (
                        <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest text-center py-16">Awaiting actions...</p>
                    ) : (
                        entries.map((entry) => {
                            const agent = agents.find(a => a.index === entry.agentIndex)
                            return (
                                <div key={entry.id} className="flex flex-col gap-1.5 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full shadow-sm"
                                                style={{ backgroundColor: agent?.color ?? '#e4e4e7' }}
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--text-primary)' }}>
                                                {agent?.name ?? 'System'}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-medium text-zinc-400 font-mono">
                                            {formatTime(entry.timestamp)}
                                        </span>
                                    </div>

                                    <div className="pl-3.5 border-l group-hover:border-zinc-600 transition-colors" style={{ borderColor: 'var(--border-subtle)' }}>
                                        <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {entry.action}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )
                ) : (
                    debugEntries.length === 0 ? (
                        <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest text-center py-16">No technical data...</p>
                    ) : (
                        debugEntries.map((entry) => (
                            <DebugEntryView key={entry.id} entry={entry} />
                        ))
                    )
                )}
            </div>
        </div>
    )
}
