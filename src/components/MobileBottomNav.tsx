import React from 'react';
import { Home, Search, Library } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: 'home' | 'search' | 'library';
  onSelectView: (view: 'home' | 'search' | 'library') => void;
  hasOverlayView?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  hasOverlayView = false,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#000000] via-[#0a0a0a] to-[#121212]/95 backdrop-blur-lg border-t border-white/10 md:hidden select-none pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
      <div className="flex items-center justify-around px-4">
        {/* Home Tab */}
        <button
          onClick={() => onSelectView('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            currentView === 'home' && !hasOverlayView
              ? 'text-white'
              : 'text-[#a7a7a7] hover:text-white'
          }`}
        >
          <Home
            size={22}
            className={`transition-transform ${
              currentView === 'home' && !hasOverlayView ? 'scale-110' : ''
            }`}
          />
          <span className="text-[11px] font-semibold tracking-tight">Home</span>
        </button>

        {/* Search Tab */}
        <button
          onClick={() => onSelectView('search')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            currentView === 'search' && !hasOverlayView
              ? 'text-white'
              : 'text-[#a7a7a7] hover:text-white'
          }`}
        >
          <Search
            size={22}
            className={`transition-transform ${
              currentView === 'search' && !hasOverlayView ? 'scale-110' : ''
            }`}
          />
          <span className="text-[11px] font-semibold tracking-tight">Search</span>
        </button>

        {/* Your Library Tab */}
        <button
          onClick={() => onSelectView('library')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            currentView === 'library' && !hasOverlayView
              ? 'text-white'
              : 'text-[#a7a7a7] hover:text-white'
          }`}
        >
          <Library
            size={22}
            className={`transition-transform ${
              currentView === 'library' && !hasOverlayView ? 'scale-110' : ''
            }`}
          />
          <span className="text-[11px] font-semibold tracking-tight">Your Library</span>
        </button>
      </div>
    </nav>
  );
};