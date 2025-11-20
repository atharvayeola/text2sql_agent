import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { motion } from 'framer-motion';

SyntaxHighlighter.registerLanguage('sql', sql);

interface AgentResponseProps {
    sql: string;
    answer: string;
    rows: any[];
    attempts: number;
    error?: string;
}

export const AgentResponse: React.FC<AgentResponseProps> = ({ sql, answer, rows, attempts, error }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 w-full max-w-3xl"
        >
            {/* Answer Section */}
            <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Answer</h3>
                <p className="text-lg text-foreground">{answer}</p>
            </div>

            {/* SQL Section */}
            {sql && (
                <div className="bg-zinc-50 border border-border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-zinc-100 px-4 py-2 border-b border-border flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">Generated SQL</span>
                        <span className="text-xs text-muted-foreground">Attempts: {attempts}</span>
                    </div>
                    <SyntaxHighlighter
                        language="sql"
                        style={docco}
                        customStyle={{ background: 'transparent', padding: '1rem', fontSize: '0.9rem' }}
                    >
                        {sql}
                    </SyntaxHighlighter>
                </div>
            )}

            {/* Data Table Section */}
            {rows && rows.length > 0 && (
                <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border bg-zinc-50">
                        <h3 className="text-sm font-medium text-muted-foreground">Result Data</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-zinc-50 border-b border-border">
                                <tr>
                                    {Object.keys(rows[0]).map((key) => (
                                        <th key={key} className="px-6 py-3 font-medium">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="bg-white border-b border-border hover:bg-zinc-50 transition-colors">
                                        {Object.values(row).map((val: any, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-foreground">
                                                {val?.toString()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Error Section */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </motion.div>
    );
};
