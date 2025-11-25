import React from 'react';
import { Upload, FileSpreadsheet, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
    onUpload: (file: File) => void;
    isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isUploading }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl mx-auto mb-12"
        >
            <label
                className={`
            flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed border-zinc-300 rounded-2xl 
            cursor-pointer bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400 
            transition-all duration-300 group
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <div className="mb-4 p-4 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                        <Upload className="w-8 h-8 text-zinc-500 group-hover:text-black transition-colors" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-zinc-700">
                        Drop your database file here
                    </p>
                    <p className="text-sm text-zinc-500 mb-4">
                        Supports .csv, .json, .sqlite, .db
                    </p>
                    <div className="flex gap-2 text-xs text-zinc-400">
                        <span className="flex items-center gap-1"><FileSpreadsheet size={12} /> CSV</span>
                        <span className="flex items-center gap-1"><Database size={12} /> SQLite</span>
                    </div>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.db,.sqlite"
                    onChange={handleFileChange}
                />
            </label>
        </motion.div>
    );
};
