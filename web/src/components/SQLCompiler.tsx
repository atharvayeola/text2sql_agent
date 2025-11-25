import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Wand2, Database, Table, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';


interface SQLCompilerProps {
    schema: any;
}

interface QueryResult {
    rows: any[];
    error?: string;
}

export function SQLCompiler({ schema }: SQLCompilerProps) {
    const [code, setCode] = useState<string>('-- Write your SQL query here\nSELECT * FROM \nLIMIT 10;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

    const toggleTable = (tableName: string) => {
        const newExpanded = new Set(expandedTables);
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName);
        } else {
            newExpanded.add(tableName);
        }
        setExpandedTables(newExpanded);
    };

    const handleRun = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await axios.post('/api/execute_sql', { sql: code });
            setResult(response.data);
        } catch (error: any) {
            setResult({
                rows: [],
                error: error.response?.data?.detail || error.message || 'An unknown error occurred'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        try {
            const response = await axios.post('/api/generate_sql', {
                question: aiPrompt,
                model_type: 'openai' // Defaulting to OpenAI for now, could be made configurable
            });
            if (response.data.sql) {
                setCode(response.data.sql);
            } else if (response.data.error) {
                // Show error in some way, maybe a toast or just in the result area
                setResult({ rows: [], error: response.data.error });
            }
        } catch (error: any) {
            setResult({
                rows: [],
                error: error.response?.data?.detail || error.message || 'Failed to generate SQL'
            });
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-zinc-900 text-zinc-100 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
            {/* Sidebar - Schema Explorer */}
            <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                    <Database size={16} className="text-zinc-400" />
                    <span className="font-semibold text-sm tracking-wide">Database Schema</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {schema && Object.entries(schema).map(([tableName, tableData]: [string, any]) => {
                        // Handle both array format (columns) and object format with columns property
                        const columns = Array.isArray(tableData) ? tableData : tableData.columns || [];

                        return (
                            <div key={tableName} className="mb-1">
                                <button
                                    onClick={() => toggleTable(tableName)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-900 rounded text-left text-sm text-zinc-300 transition-colors"
                                >
                                    {expandedTables.has(tableName) ? (
                                        <ChevronDown size={14} />
                                    ) : (
                                        <ChevronRight size={14} />
                                    )}
                                    <Table size={14} className="text-blue-400" />
                                    <span className="truncate">{tableName}</span>
                                </button>

                                {expandedTables.has(tableName) && (
                                    <div className="ml-6 mt-1 space-y-0.5 border-l border-zinc-800 pl-2">
                                        {columns.map((col: any, idx: number) => {
                                            // Handle both string and object formats
                                            const colName = typeof col === 'string' ? col : col.name || col;
                                            const colType = typeof col === 'object' ? col.type : 'text';

                                            return (
                                                <div key={idx} className="text-xs text-zinc-500 py-0.5 flex items-center justify-between group">
                                                    <span className="group-hover:text-zinc-300 transition-colors">{colName}</span>
                                                    <span className="text-[10px] text-zinc-600 font-mono">{colType}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Wand2 size={16} className={`text-purple-400 ${isAiLoading ? 'animate-pulse' : ''}`} />
                            </div>
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                placeholder="Ask AI to generate SQL (e.g., 'Show top 5 users by sales')"
                                className="w-full bg-zinc-950 border border-zinc-800 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
                            />
                            <button
                                onClick={handleAiGenerate}
                                disabled={isAiLoading || !aiPrompt}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleRun}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play size={16} fill="currentColor" />
                        )}
                        Run Query
                    </button>
                </div>

                {/* Editor Area */}
                <div className="h-[40%] border-b border-zinc-800 relative group">
                    <Editor
                        height="100%"
                        defaultLanguage="sql"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 16 },
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950">
                    <div className="p-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-2">Query Results</span>
                        {result?.rows && (
                            <span className="text-xs text-zinc-500">{result.rows.length} rows returned</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {result?.error ? (
                            <div className="p-8 flex flex-col items-center justify-center text-red-400 gap-3">
                                <AlertCircle size={32} />
                                <p className="font-mono text-sm text-center max-w-2xl bg-red-950/30 p-4 rounded-lg border border-red-900/50">
                                    {result.error}
                                </p>
                            </div>
                        ) : result?.rows && result.rows.length > 0 ? (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-zinc-900 sticky top-0 z-10">
                                    <tr>
                                        {Object.keys(result.rows[0]).map((header) => (
                                            <th key={header} className="px-4 py-3 font-medium text-zinc-400 border-b border-zinc-800 whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {result.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-900/50 transition-colors">
                                            {Object.values(row).map((cell: any, j) => (
                                                <td key={j} className="px-4 py-2 text-zinc-300 whitespace-nowrap font-mono text-xs">
                                                    {cell?.toString() ?? <span className="text-zinc-600 italic">null</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : result?.rows && result.rows.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-500 text-sm italic">
                                No results returned
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                Run a query to see results
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
