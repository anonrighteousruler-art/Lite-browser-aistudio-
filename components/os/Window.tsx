import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, X, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WindowState } from '../../types';

interface WindowProps {
  window: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
  icon?: string;
}

export const Window: React.FC<WindowProps> = ({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
  icon
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus(window.id);
    if (window.isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - window.x,
      y: e.clientY - window.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onMove(window.id, e.clientX - dragStart.x, e.clientY - dragStart.y);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, window.id, onMove]);

  if (window.isMinimized) return null;

  const style: React.CSSProperties = window.isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 48px)',
        zIndex: window.zIndex,
      }
    : {
        top: window.y,
        left: window.x,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={cn(
        "absolute flex flex-col bg-[#1a1b1e] border border-[#3c4043] rounded-lg shadow-2xl overflow-hidden",
        window.isMaximized ? "rounded-none" : ""
      )}
      style={style}
      onClick={() => onFocus(window.id)}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between h-10 px-4 bg-[#292a2d] cursor-default select-none border-b border-[#3c4043]"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onMaximize(window.id)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          <span className="text-sm font-medium text-[#e8eaed] truncate">{window.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(window.id); }}
            className="p-1.5 hover:bg-[#3c4043] rounded-md text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMaximize(window.id); }}
            className="p-1.5 hover:bg-[#3c4043] rounded-md text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
          >
            {window.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(window.id); }}
            className="p-1.5 hover:bg-[#ea4335] rounded-md text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-black relative">
        {children}
      </div>

      {/* Resize Handle */}
      {!window.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = window.width;
            const startHeight = window.height;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              onResize(
                window.id,
                Math.max(400, startWidth + (moveEvent.clientX - startX)),
                Math.max(300, startHeight + (moveEvent.clientY - startY))
              );
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </motion.div>
  );
};
