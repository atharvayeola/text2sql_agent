import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table as TableIcon, Key, X, Database } from 'lucide-react';

interface SchemaViewerProps {
    schema: any;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    if (!schema) return null;

    // Get the data for the currently selected table
    const activeTableData = selectedTable ? schema[selectedTable] : null;

    return (
        <div className="w-full max-w-5xl mx-auto mb-8 flex flex-col gap-6">

            {/* Section Header */}
            <div className="flex items-center gap-2 px-2">
                <Database className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-semibold text-zinc-800">Database Schema</h2>
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">
                    {Object.keys(schema).length} Tables
                </span>
            </div>

            {/* Horizontal Scrollable Cards */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-4 min-w-max">
                    {Object.entries(schema).map(([tableName, tableData]: [string, any], idx) => (
                        <motion.button
                            key={tableName}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedTable(selectedTable === tableName ? null : tableName)}
                            className={`
                    group relative flex flex-col items-start text-left
                    w-64 p-4 rounded-xl border-2 transition-all duration-200
                    ${selectedTable === tableName
                                    ? 'bg-black border-black text-white shadow-lg scale-[1.02]'
                                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:shadow-md'
                                }
                `}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="flex items-center gap-2">
                                    <TableIcon size={16} className={selectedTable === tableName ? 'text-zinc-300' : 'text-zinc-400'} />
                                    <span className="font-bold text-sm truncate max-w-[120px]" title={tableName}>
                                        {tableName}
                                    </span>
                                </div>
                                {selectedTable === tableName && (
                                    <motion.div layoutId="active-indicator" className="w-2 h-2 bg-white rounded-full" />
                                )}
                            </div>

                            <div className="w-full space-y-1.5">
                                {tableData.columns.slice(0, 4).map((col: string, i: number) => (
                                    <div key={i} className="flex items-center text-xs opacity-80">
                                        <div className={`w-1 h-1 rounded-full mr-2 ${selectedTable === tableName ? 'bg-zinc-400' : 'bg-zinc-300'}`} />
                                        <span className="truncate">{col}</span>
                                        {(col.endsWith('_id') || col === 'id') && (
                                            <Key size={8} className="ml-auto opacity-50" />
                                        )}
                                    </div>
                                ))}
                                {tableData.columns.length > 4 && (
                                    <div className="text-[10px] opacity-50 pt-1 pl-3">
                                        + {tableData.columns.length - 4} more columns
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Data Preview Panel (Expandable) */}
            <AnimatePresence mode="wait">
                {selectedTable && activeTableData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                            {/* Preview Header */}
                            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-zinc-800">Preview: {selectedTable}</h3>
                                    <span className="text-xs text-zinc-400 font-mono">
                                        ({activeTableData.sample_rows?.length || 0} rows)
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedTable(null)}
                                    className="p-1 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Data Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                                        <tr>
                                            {activeTableData.columns.map((col: string) => (
                                                <th key={col} className="px-6 py-3 font-medium whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        {col}
                                                        {(col.endsWith('_id') || col === 'id') && <Key size={10} className="text-amber-500" />}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTableData.sample_rows?.map((row: any, idx: number) => (
                                            <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors last:border-0">
                                                {activeTableData.columns.map((col: string) => (
                                                    <td key={`${idx}-${col}`} className="px-6 py-3 text-zinc-600 whitespace-nowrap font-mono text-xs">
                                                        {row[col]?.toString() || <span className="text-zinc-300 italic">null</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {(!activeTableData.sample_rows || activeTableData.sample_rows.length === 0) && (
                                            <tr>
                                                <td colSpan={activeTableData.columns.length} className="px-6 py-8 text-center text-zinc-400 italic">
                                                    No sample data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
