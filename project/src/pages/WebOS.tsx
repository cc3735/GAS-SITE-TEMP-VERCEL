import React, { useState, useEffect } from 'react';
import { Terminal, Maximize2, Minimize2, X, Folder, FileText, Settings, Globe, Cpu, Grid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Window {
  id: string;
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export default function WebOS() {
  const { setTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [windows, setWindows] = useState<Window[]>([
    {
      id: 'welcome',
      title: 'Welcome to WebOS',
      content: (
        <div className="p-4 text-white">
          <h2 className="text-xl font-bold mb-2">System Online</h2>
          <p>Welcome to the neural interface.</p>
          <p className="mt-4 text-sm opacity-70">Running kernel v4.2.0</p>
        </div>
      ),
      isOpen: true,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 }
    }
  ]);

  // Force Neon theme on mount
  useEffect(() => {
    setTheme('neon');
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleWindow = (id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, isOpen: !w.isOpen, isMinimized: false };
      }
      return w;
    }));
  };

  const openApp = (app: string) => {
    // Simple app launcher logic
    const newWindow: Window = {
      id: `app-${Date.now()}`,
      title: app,
      content: <div className="p-4 text-white">Running {app}...</div>,
      isOpen: true,
      isMinimized: false,
      position: { x: 150 + windows.length * 20, y: 150 + windows.length * 20 },
      size: { width: 500, height: 400 }
    };
    setWindows([...windows, newWindow]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f172a] relative font-mono text-white selection:bg-purple-500 selection:text-white">
      {/* Desktop Background / Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Top Bar */}
      <div className="h-8 bg-[#1e293b]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50 relative">
        <div className="flex items-center gap-4">
          <Terminal size={14} className="text-purple-400" />
          <span className="text-xs font-bold tracking-wider">THOUGHTVAULT // WEBOS</span>
        </div>
        <div className="text-xs text-slate-400">
          {time.toLocaleTimeString()}
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-12 left-4 flex flex-col gap-6 z-0">
        {[
          { name: 'System', icon: Cpu, action: () => openApp('System Monitor') },
          { name: 'Files', icon: Folder, action: () => openApp('File Explorer') },
          { name: 'Network', icon: Globe, action: () => openApp('Network Map') },
          { name: 'Settings', icon: Settings, action: () => openApp('Config') },
        ].map((item) => (
          <button 
            key={item.name}
            onClick={item.action}
            className="flex flex-col items-center gap-2 group w-20 p-2 rounded hover:bg-white/5 transition"
          >
            <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition">
              <item.icon size={24} className="text-slate-300 group-hover:text-purple-400" />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 group-hover:text-white">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Windows */}
      {windows.map(window => window.isOpen && !window.isMinimized && (
        <div 
          key={window.id}
          className="absolute bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style={{ 
            left: window.position.x, 
            top: window.position.y, 
            width: window.size.width, 
            height: window.size.height 
          }}
        >
          {/* Window Title Bar */}
          <div className="h-8 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 cursor-move select-none">
            <div className="flex items-center gap-2">
              <Grid size={12} className="text-purple-400" />
              <span className="text-xs font-medium text-slate-300">{window.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setWindows(prev => prev.map(w => w.id === window.id ? {...w, isMinimized: true} : w))} className="hover:text-white text-slate-500"><Minimize2 size={12} /></button>
              <button className="hover:text-white text-slate-500"><Maximize2 size={12} /></button>
              <button onClick={() => toggleWindow(window.id)} className="hover:text-red-400 text-slate-500"><X size={12} /></button>
            </div>
          </div>
          
          {/* Window Content */}
          <div className="flex-1 overflow-auto">
            {window.content}
          </div>
        </div>
      ))}

      {/* Bottom Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-14 bg-[#1e293b]/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2 px-4 z-50">
        {windows.map(window => window.isOpen && (
          <button
            key={window.id}
            onClick={() => setWindows(prev => prev.map(w => w.id === window.id ? {...w, isMinimized: !w.isMinimized} : w))}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative ${window.isMinimized ? 'bg-white/5 opacity-50' : 'bg-white/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]'}`}
          >
            <Terminal size={18} className="text-purple-400" />
            <div className="absolute -bottom-1 w-1 h-1 bg-purple-500 rounded-full"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
