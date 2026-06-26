import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../api/client';
import { 
  Compass, 
  Layers, 
  CheckSquare, 
  TrendingUp, 
  LogOut, 
  Settings2, 
  Menu, 
  X, 
  Radio, 
  CloudLightning,
  ChevronDown,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface NavigationProps {
  currentUser: User | null;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  onConfigChange?: () => void;
}

export default function Navigation({
  currentUser,
  activeTab,
  onChangeTab,
  onLogout,
  onConfigChange
}: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // API Connection toggle configs
  const currentConfig = apiClient.getConfig();
  const [apiPort, setApiPort] = useState(currentConfig.baseUrl);
  const [useLiveBackend, setUseLiveBackend] = useState(currentConfig.useLiveBackend);

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    apiClient.updateConfig({
      baseUrl: apiPort,
      useLiveBackend
    });
    setShowConfig(false);
    // Reload state caches without fully reloading the page
    if (onConfigChange) {
      onConfigChange();
    }
  };

  const handleDirectToggle = () => {
    const nextBackendState = !useLiveBackend;
    setUseLiveBackend(nextBackendState);
    apiClient.updateConfig({
      baseUrl: apiPort,
      useLiveBackend: nextBackendState
    });
    if (onConfigChange) {
      onConfigChange();
    }
  };

  const navItems = [
    { id: 'workspace', label: 'Manga Workspace', icon: Compass, roles: ['MANGAKA', 'EDITOR'] },
    { id: 'chapters', label: 'Chapter Management', icon: BookOpen, roles: ['MANGAKA', 'EDITOR'] },
    { id: 'tasks', label: 'Series Proposals', icon: Layers, roles: ['MANGAKA', 'EDITOR'] },
    { id: 'board', label: 'Editorial Board', icon: CheckSquare, roles: ['EDITOR', 'BOARD_MEMBER'] },
    { id: 'analytics', label: 'Rankings Dashboard', icon: TrendingUp, roles: ['BOARD_MEMBER', 'MANGAKA'] }
  ];

  // Filtering tabs representing only items the current role has clearance for
  const filteredNavItems = navItems.filter((item) => {
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  });

  return (
    <>
      {/* Mobile Top Header Ribbon */}
      <header className="md:hidden h-16 bg-[#E63946] text-white flex items-center justify-between px-4 fixed top-0 left-0 w-full z-40 border-b-4 border-ink-black shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-xs flex items-center justify-center">
            <span className="text-[#E63946] font-black text-xl">M</span>
          </div>
          <span className="font-syne text-sm font-black uppercase tracking-widest leading-none">MANGA STUDIO OS</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 text-white focus:outline-none cursor-pointer"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Left Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white text-ink-black z-40 transition-transform duration-300 transform md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} border-r-4 border-ink-black flex flex-col justify-between p-0 select-none shadow-[4px_0px_0px_rgba(20,20,20,0.15)]`}>
        
        {/* Brand Header & Quick switch */}
        <div className="flex flex-col">
          <div className="p-6 border-b-4 border-ink-black flex items-center gap-3 bg-[#E63946] text-white">
            <div className="w-9 h-9 bg-white rounded-sm flex items-center justify-center outline outline-2 outline-white shadow-sm flex-shrink-0">
              <span className="text-[#E63946] font-extrabold text-2xl font-syne">M</span>
            </div>
            <div>
              <span className="font-syne font-black uppercase tracking-tighter text-lg leading-tight block">Manga<br/>Studio OS</span>
            </div>
          </div>

          {/* Quick Switch User Role Controller (Teacher/Review Friendly) */}
          {currentUser && (
            <div className="p-4 border-b-2 border-ink-black bg-[#F5F5F0]">
              <span className="text-neutral-500 font-mono text-[9px] uppercase font-bold tracking-widest block mb-1">
                Studio Auth &amp; Role
              </span>
              
              <div className="flex items-center gap-3 bg-white p-2.5 border-2 border-ink-black rounded-sm shadow-[2px_2px_0px_#141414]">
                <img 
                  src={currentUser.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCHg4AqOzqTV4dewyU1i46CaCUf4pdWEGhiU2lW3liCFs9JIde6fE9uwaRXVueKT86jIlGpymMPHJCh6-Coee4I6o2JxMGU-b-ts2Dmy6dKXtzK6RPgJ9XIL-1TYRm1JkqG8CkCx_ZgdB3cBNUUJyT9pvzu7uKesV0D55DoIMkLIv6PspHUrWtqKEj3H2tBogMUnEDiuCIIKF5mSpOCdwVfdskbQpvNQx3V_lA8OtcIk6q8LZ9AmfiRwuw0bF5K5naoU52pMuRXDiP2"} 
                  alt={currentUser.name} 
                  className="w-10 h-10 rounded-full border-2 border-ink-black object-cover flex-shrink-0 bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-xs text-ink-black font-extrabold truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="font-mono text-[9px] text-[#E63946] font-bold tracking-tight uppercase mt-0.5 italic">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              {/* User email info reference */}
              <div className="border-t border-dashed border-neutral-300 mt-2.5 pt-2 text-center">
                <span className="text-neutral-500 font-mono text-[8px] uppercase tracking-wider block font-bold">
                  STUDIO SESSION ACCOUNT ACTIVE
                </span>
              </div>
            </div>
          )}

          {/* Tab Navigation items */}
          <nav className="p-4 space-y-1">
            <div className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1 mb-2">Quy trình sáng tác</div>
            {filteredNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 border-2 transition-all cursor-pointer select-none rounded-none font-syne text-[11px] font-black uppercase tracking-tight ${
                    isActive 
                      ? 'bg-ink-black text-white border-ink-black shadow-[3px_3px_0px_#141414]' 
                      : 'bg-white text-neutral-600 border-transparent hover:border-ink-black hover:bg-neutral-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-[#E63946]' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </span>
                  
                  {isActive && (
                    <span className="bg-[#E63946] text-white text-[9px] px-1.5 py-0.5 rounded-none font-sans font-bold">ACTIVE</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Configurations footer & logout */}
        <div className="p-4 border-t-2 border-ink-black bg-[#F5F5F0] space-y-3">
          
          {/* BE Connection Config drawer */}
          <div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-between w-full text-ink-black hover:text-[#E63946] text-[10px] font-mono font-black uppercase cursor-pointer pb-2"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Connection API
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>

            {useLiveBackend ? (
              <button
                type="button"
                onClick={handleDirectToggle}
                title="Click to toggle to Local Emulator"
                className="inline-flex items-center gap-1.5 bg-[#2ECC71]/10 px-2 py-1 border border-ink-black text-[#2ECC71] font-mono text-[9px] font-black uppercase rounded-xs cursor-pointer hover:bg-[#2ECC71]/25 transition-all text-left"
              >
                <CloudLightning className="w-3 h-3 animate-pulse text-[#2ECC71]" />
                LIVE REST SYNC
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDirectToggle}
                title="Click to toggle to Live Backend SYNC"
                className="inline-flex items-center gap-1.5 bg-[#FFF3B0] px-2 py-1 border border-ink-black text-black font-mono text-[9px] font-black uppercase rounded-xs cursor-pointer hover:bg-amber-100 transition-all text-left"
              >
                <Radio className="w-3 h-3 text-[#E63946]" />
                LOCAL EMULATOR
              </button>
            )}

            {showConfig && (
              <form onSubmit={handleConfigSave} className="bg-white border-2 border-ink-black rounded-sm p-3 space-y-2 mt-2 shadow-[2px_2px_0px_#141414] animate-fadeIn">
                <div>
                  <label className="block text-[8px] font-mono text-ink-black font-bold uppercase mb-0.5" htmlFor="portI">Target API Address</label>
                  <input
                    id="portI"
                    type="text"
                    className="w-full bg-[#F5F5F0] text-ink-black text-[10px] font-mono p-1 border border-ink-black focus:outline-none"
                    value={apiPort}
                    onChange={(e) => setApiPort(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between pb-1 pt-1">
                  <span className="text-[8px] font-mono text-ink-black font-bold uppercase">Connect Live Node</span>
                  <input
                    type="checkbox"
                    className="form-checkbox text-[#E63946] border-2 border-ink-black focus:ring-0 rounded-none w-3.5 h-3.5"
                    checked={useLiveBackend}
                    onChange={(e) => setUseLiveBackend(e.target.checked)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E63946] text-white py-1 px-1.5 text-[9px] font-mono font-bold uppercase border-2 border-ink-black shadow-[1.5px_1.5px_0px_#141414] transition-all hover:bg-red-600 cursor-pointer"
                >
                  Save &amp; Reload
                </button>
              </form>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-ink-black hover:bg-neutral-50 text-ink-black font-syne text-[10px] uppercase font-black tracking-tight py-2 rounded-none shadow-[2px_2px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E63946]" />
            Exit Studio OS
          </button>
        </div>

      </aside>

      {/* Main Right Sidebar Backdrop Overlay for small devices */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}
    </>
  );
}
