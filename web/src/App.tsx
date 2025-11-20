import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, MessageSquare } from 'lucide-react';
import { ChatInput } from './components/ChatInput';
import { FileUpload } from './components/FileUpload';
import { AgentResponse } from './components/AgentResponse';
import { SchemaViewer } from './components/SchemaViewer';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content?: string;
  data?: any;
}

function App() {
  const [hasFile, setHasFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHasFile(true);
      setSchema(response.data.schema);
      setMessages([{
        id: 'system-1',
        type: 'agent',
        content: `Successfully loaded ${file.name}. You can now ask questions about your data!`
      }]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (question: string, model: string) => {
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, type: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/query', { question, model_type: model });
      const agentMsgId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: agentMsgId,
        type: 'agent',
        data: response.data
      }]);
    } catch (error: any) {
      console.error('Query failed:', error);
      const errorMessage = error.response?.data?.detail || error.message || "An unknown error occurred.";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        data: {
          answer: "Sorry, I encountered an error processing your request.",
          error: errorMessage,
          rows: [],
          attempts: 0,
          sql: ""
        }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Database size={18} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Text2SQL Agent</h1>
          </div>
          {hasFile && (
            <button
              onClick={() => setHasFile(false)}
              className="text-sm text-zinc-500 hover:text-black transition-colors"
            >
              Change Database
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          {!hasFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">Analyze your data with AI</h2>
                <p className="text-zinc-500 text-lg max-w-md mx-auto">
                  Upload a CSV or SQLite database to start asking questions in plain English.
                </p>
              </div>
              <FileUpload onUpload={handleUpload} isUploading={isUploading} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-8"
            >
              {/* Schema Visualization */}
              <SchemaViewer schema={schema} />

              <div className="flex flex-col gap-8">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'agent' && (
                      <div className="w-8 h-8 bg-black rounded-full flex-shrink-0 flex items-center justify-center text-white mt-1">
                        <Database size={14} />
                      </div>
                    )}

                    <div className={`max-w-3xl ${msg.type === 'user' ? 'w-auto' : 'w-full'}`}>
                      {msg.type === 'user' ? (
                        <div className="bg-zinc-200 px-6 py-3 rounded-2xl rounded-tr-sm text-zinc-900 font-medium">
                          {msg.content}
                        </div>
                      ) : (
                        msg.data ? (
                          <AgentResponse {...msg.data} />
                        ) : (
                          <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                            {msg.content}
                          </div>
                        )
                      )}
                    </div>

                    {msg.type === 'user' && (
                      <div className="w-8 h-8 bg-zinc-200 rounded-full flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                        <MessageSquare size={14} />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex-shrink-0 flex items-center justify-center text-white mt-1">
                      <Database size={14} />
                    </div>
                    <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {hasFile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pt-12">
          <ChatInput onSend={handleQuery} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}

export default App;
