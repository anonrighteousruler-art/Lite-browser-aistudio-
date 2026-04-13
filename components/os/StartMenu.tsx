import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Power, Settings, User, LogOut } from 'lucide-react';
import { AppConfig } from '../../types';

interface StartMenuProps {
  isOpen: boolean;
  apps: AppConfig[];
  onAppClick: (appId: string) => void;
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  apps,
  onAppClick,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="fixed bottom-14 left-4 w-[400px] h-[500px] bg-[#1a1b1e]/95 backdrop-blur-2xl border border-[#3c4043] rounded-2xl shadow-2xl z-[9998] flex flex-col overflow-hidden"
          >
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0a6]" size={16} />
                <input
                  type="text"
                  placeholder="Search apps, settings, and files"
                  className="w-full bg-[#292a2d] border border-[#3c4043] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#e8eaed] focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

            {/* Pinned Apps */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider">Pinned Apps</span>
                <button className="text-xs text-[#8ab4f8] hover:underline">All apps</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {apps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => { onAppClick(app.id); onClose(); }}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-[#3c4043] transition-colors group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-[#292a2d] border border-[#3c4043] rounded-xl group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl text-[#8ab4f8]">{app.icon}</span>
                    </div>
                    <span className="text-[11px] text-[#e8eaed] text-center truncate w-full">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Profile / Footer */}
            <div className="p-4 bg-[#292a2d]/50 border-t border-[#3c4043] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8ab4f8] flex items-center justify-center text-[#1a1b1e] font-bold text-xs">
                  JD
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#e8eaed]">John Doe</span>
                  <span className="text-[10px] text-[#9aa0a6]">Gemini OS Pro</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#3c4043] rounded-lg text-[#9aa0a6] hover:text-[#e8eaed] transition-colors">
                  <Settings size={16} />
                </button>
                <button className="p-2 hover:bg-[#3c4043] rounded-lg text-[#9aa0a6] hover:text-[#e8eaed] transition-colors">
                  <Power size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
