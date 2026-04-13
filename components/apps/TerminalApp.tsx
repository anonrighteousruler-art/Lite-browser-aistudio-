import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Send, Trash2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const TerminalApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Gemini OS Terminal v1.0.0\nType "help" for a list of commands or just talk to me.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    if (userText.toLowerCase() === 'clear') {
      setMessages([{ role: 'model', text: 'Terminal cleared.' }]);
      return;
    }

    if (userText.toLowerCase() === 'help') {
      setMessages(prev => [...prev, { role: 'model', text: 'Available commands:\n- clear: Clear the terminal\n- help: Show this help message\n- whoami: Show current user info\n- date: Show current date and time' }]);
      return;
    }

    if (userText.toLowerCase() === 'whoami') {
      setMessages(prev => [...prev, { role: 'model', text: 'User: John Doe\nRole: Gemini OS Pro Administrator' }]);
      return;
    }

    if (userText.toLowerCase() === 'date') {
      setMessages(prev => [...prev, { role: 'model', text: new Date().toLocaleString() }]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
          systemInstruction: "You are the Gemini OS Terminal assistant. Keep responses concise and technical. Use plain text or simple markdown. No emojis unless requested."
        }
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'No response from Gemini.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0e10] font-mono text-sm text-[#e8eaed]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-[#8ab4f8]' : 'text-[#81c995]'}>
            <span className="opacity-50 mr-2">{msg.role === 'user' ? '>' : '$'}</span>
            <span className="whitespace-pre-wrap">{msg.text}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-[#9aa0a6] animate-pulse">
            <span>$</span>
            <div className="w-2 h-4 bg-[#9aa0a6]" />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#3c4043] bg-[#1a1b1e]">
        <div className="flex items-center gap-2">
          <span className="text-[#8ab4f8] font-bold">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-[#e8eaed]"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-1.5 hover:bg-[#3c4043] rounded-md text-[#9aa0a6] hover:text-[#e8eaed] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
