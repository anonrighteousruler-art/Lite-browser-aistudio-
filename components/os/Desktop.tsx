import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { BrowserApp } from '../apps/BrowserApp';
import { TerminalApp } from '../apps/TerminalApp';
import { SettingsApp } from '../apps/SettingsApp';
import JSZip from 'jszip';
import { AppConfig, WindowState } from '../../types';
import { cn } from '../../lib/utils';

const INITIAL_APPS: AppConfig[] = [
  {
    id: 'browser',
    name: 'Flash-Lite Browser',
    icon: 'language',
    component: BrowserApp,
    defaultWidth: 1000,
    defaultHeight: 700
  },
  {
    id: 'terminal',
    name: 'Gemini Terminal',
    icon: 'terminal',
    component: TerminalApp,
    defaultWidth: 600,
    defaultHeight: 400
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    component: SettingsApp,
    defaultWidth: 800,
    defaultHeight: 500
  }
];

// Dynamic App Component to render uploaded ZIP content
const DynamicApp: React.FC<{ content: string }> = ({ content }) => {
  return (
    <iframe 
      srcDoc={content} 
      className="w-full h-full border-none bg-white"
      title="Dynamic App"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

export const Desktop: React.FC = () => {
  const [apps, setApps] = useState<AppConfig[]>(INITIAL_APPS);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
  const [nextZIndex, setNextZIndex] = useState(100);

  const openApp = useCallback((appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const newWindow: WindowState = {
      id: `${appId}-${Date.now()}`,
      appId: appId,
      title: app.name,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      x: 100 + (windows.length * 30),
      y: 100 + (windows.length * 30),
      width: app.defaultWidth || 800,
      height: app.defaultHeight || 600,
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setNextZIndex(prev => prev + 1);
  }, [apps, windows.length, nextZIndex]);

  const handleAddApp = useCallback(async (file: File) => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      // Look for index.html
      const indexFile = contents.file('index.html') || Object.values(contents.files).find(f => f.name.endsWith('.html'));
      
      if (!indexFile) {
        alert('No HTML file found in ZIP');
        return;
      }

      const htmlContent = await indexFile.async('string');
      const appId = `custom-${Date.now()}`;
      const appName = file.name.replace('.zip', '');

      const newApp: AppConfig = {
        id: appId,
        name: appName,
        icon: 'extension',
        component: () => <DynamicApp content={htmlContent} />,
        defaultWidth: 800,
        defaultHeight: 600
      };

      setApps(prev => [...prev, newApp]);
      alert(`App "${appName}" added successfully!`);
    } catch (error) {
      console.error('Error adding app:', error);
      alert('Failed to add app. Make sure it is a valid ZIP file.');
    }
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  }, [activeWindowId]);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
    ));
    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    setActiveWindowId(null);
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, x, y } : w
    ));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, width, height } : w
    ));
  }, []);

  const handleTaskbarAppClick = useCallback((appId: string) => {
    const appWindows = windows.filter(w => w.appId === appId);
    if (appWindows.length > 0) {
      // If there are windows, focus the last one or toggle minimize if active
      const lastWindow = appWindows[appWindows.length - 1];
      if (activeWindowId === lastWindow.id) {
        minimizeWindow(lastWindow.id);
      } else {
        focusWindow(lastWindow.id);
      }
    } else {
      openApp(appId);
    }
  }, [windows, activeWindowId, openApp, focusWindow, minimizeWindow]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${wallpaper})` }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>

      {/* Desktop Icons */}
      <div className="absolute inset-0 p-4 grid grid-flow-col grid-rows-[repeat(auto-fill,100px)] gap-4 w-fit">
        {apps.map(app => (
          <button
            key={app.id}
            onDoubleClick={() => openApp(app.id)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors group w-20"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#1a1b1e]/60 backdrop-blur-md border border-white/10 rounded-xl group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl text-[#8ab4f8]">{app.icon}</span>
            </div>
            <span className="text-[11px] text-white text-center drop-shadow-md font-medium truncate w-full">
              {app.name}
            </span>
          </button>
        ))}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map(window => {
          const app = apps.find(a => a.id === window.appId);
          const AppComp = app?.component;
          return (
            <Window
              key={window.id}
              window={window}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onMaximize={maximizeWindow}
              onFocus={focusWindow}
              onMove={moveWindow}
              onResize={resizeWindow}
              icon={app?.icon}
            >
              {AppComp && (
                window.appId === 'settings' 
                  ? <SettingsApp onWallpaperChange={setWallpaper} />
                  : <AppComp />
              )}
            </Window>
          );
        })}
      </AnimatePresence>

      {/* Start Menu */}
      <StartMenu
        isOpen={isStartMenuOpen}
        apps={apps}
        onAppClick={openApp}
        onClose={() => setIsStartMenuOpen(false)}
      />

      {/* Taskbar */}
      <Taskbar
        apps={apps}
        windows={windows}
        activeWindowId={activeWindowId}
        onStartClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
        onAppClick={handleTaskbarAppClick}
        onWindowClick={focusWindow}
        onAddApp={handleAddApp}
      />
    </div>
  );
};
