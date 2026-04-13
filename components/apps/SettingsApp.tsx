import React, { useState } from 'react';
import { Palette, Monitor, Shield, Info, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const WALLPAPERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2532&auto=format&fit=crop',
];

export const SettingsApp: React.FC<{ onWallpaperChange: (url: string) => void }> = ({ onWallpaperChange }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [currentWallpaper, setCurrentWallpaper] = useState(WALLPAPERS[0]);

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="flex h-full bg-[#1a1b1e] text-[#e8eaed]">
      {/* Sidebar */}
      <div className="w-48 border-r border-[#3c4043] p-2 flex flex-col gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === tab.id ? "bg-[#3c4043] text-white" : "hover:bg-[#3c4043]/50 text-[#9aa0a6]"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'appearance' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Wallpaper</h2>
              <div className="grid grid-cols-2 gap-4">
                {WALLPAPERS.map(url => (
                  <button
                    key={url}
                    onClick={() => { setCurrentWallpaper(url); onWallpaperChange(url); }}
                    className="relative aspect-video rounded-xl overflow-hidden border-2 transition-all group"
                    style={{ borderColor: currentWallpaper === url ? '#8ab4f8' : 'transparent' }}
                  >
                    <img src={url} alt="Wallpaper" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    {currentWallpaper === url && (
                      <div className="absolute inset-0 bg-[#8ab4f8]/20 flex items-center justify-center">
                        <div className="bg-[#8ab4f8] rounded-full p-1">
                          <Check size={16} className="text-[#1a1b1e]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Theme</h2>
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-[#292a2d] border border-[#8ab4f8] rounded-xl flex flex-col items-center gap-2">
                  <div className="w-full h-20 bg-[#1a1b1e] rounded-lg border border-[#3c4043]" />
                  <span className="text-sm font-medium">Dark (Default)</span>
                </div>
                <div className="flex-1 p-4 bg-[#292a2d] border border-[#3c4043] rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <div className="w-full h-20 bg-white rounded-lg border border-gray-200" />
                  <span className="text-sm font-medium">Light (Coming Soon)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-md space-y-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 bg-[#8ab4f8] rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl font-bold text-[#1a1b1e]">G</span>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Gemini OS</h1>
                <p className="text-[#9aa0a6]">Version 1.0.0 (March 2026)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#292a2d] rounded-xl border border-[#3c4043]">
                <p className="text-sm leading-relaxed">
                  Gemini OS is a next-generation operating system powered by Gemini 3.1 Flash-Lite. 
                  It features a real-time generative browser and an AI-integrated terminal.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-[#9aa0a6]">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#e8eaed]">Processor</span>
                  <span>Gemini 3.1 Flash-Lite</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#e8eaed]">Memory</span>
                  <span>128K Context Window</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
