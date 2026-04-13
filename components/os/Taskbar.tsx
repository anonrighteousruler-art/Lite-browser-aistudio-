import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { AppConfig, WindowState } from '../../types';

interface TaskbarProps {
  apps: AppConfig[];
  windows: WindowState[];
  activeWindowId: string | null;
  onStartClick: () => void;
  onAppClick: (appId: string) => void;
  onWindowClick: (windowId: string) => void;
  onAddApp: (file: File) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  apps,
  windows,
  activeWindowId,
  onStartClick,
  onAppClick,
  onWindowClick,
  onAddApp
}) => {
  const [time, setTime] = React.useState(new Date());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddApp(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-12 bg-[#1a1b1e]/80 backdrop-blur-xl border-t border-[#3c4043] flex items-center px-2 gap-2 z-[9999]">
      <button
        onClick={onStartClick}
        className="w-10 h-10 flex items-center justify-center hover:bg-[#3c4043] rounded-lg transition-colors group"
      >
        <div className="grid grid-cols-2 gap-0.5 group-hover:scale-110 transition-transform">
          <div className="w-2 h-2 bg-[#8ab4f8] rounded-sm" />
          <div className="w-2 h-2 bg-[#81c995] rounded-sm" />
          <div className="w-2 h-2 bg-[#f28b82] rounded-sm" />
          <div className="w-2 h-2 bg-[#fdd663] rounded-sm" />
        </div>
      </button>

      <div className="w-px h-6 bg-[#3c4043] mx-1" />

      <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {apps.map(app => {
          const appWindows = windows.filter(w => w.appId === app.id);
          const isActive = appWindows.some(w => w.id === activeWindowId);
          const isOpen = appWindows.length > 0;

          return (
            <button
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className={cn(
                "relative h-10 px-3 flex items-center gap-2 rounded-lg transition-all duration-200",
                isActive ? "bg-[#3c4043] text-white" : "hover:bg-[#3c4043]/50 text-[#9aa0a6] hover:text-[#e8eaed]"
              )}
            >
              <span className="material-symbols-outlined text-lg">{app.icon}</span>
              <span className="text-xs font-medium hidden md:block">{app.name}</span>
              {isOpen && (
                <div className={cn(
                  "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                  isActive ? "bg-[#8ab4f8] w-4" : "bg-[#9aa0a6]"
                )} />
              )}
            </button>
          );
        })}

        <div className="w-px h-6 bg-[#3c4043] mx-1" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-10 px-3 flex items-center gap-2 rounded-lg hover:bg-[#3c4043]/50 text-[#9aa0a6] hover:text-[#e8eaed] transition-all duration-200 group"
          title="Add App (ZIP)"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add</span>
          <span className="text-xs font-medium hidden md:block">Add App</span>
        </button>
      </div>

      <div className="flex items-center gap-4 px-4 text-[#9aa0a6] text-xs font-medium">
        <div className="flex flex-col items-end">
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};
