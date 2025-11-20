import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
    onSend: (message: string, model: string) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const [input, setInput] = useState('');
    const [model, setModel] = useState('openai');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input, model);
            setInput('');
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your data..."
                        className="w-full px-6 py-4 text-lg bg-white border-2 border-border rounded-full shadow-sm focus:outline-none focus:border-black focus:ring-0 transition-all pr-32"
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-zinc-100 border-none text-xs font-medium rounded-md px-2 py-1 text-zinc-600 cursor-pointer hover:bg-zinc-200 transition-colors focus:ring-0"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="local">Local (T5)</option>
                        </select>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-4 bg-black text-white rounded-full shadow-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </motion.button>
            </form>
        </div>
    );
};
