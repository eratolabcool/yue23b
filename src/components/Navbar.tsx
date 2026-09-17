import React from 'react';
import { Music2, Sparkles, Sliders, Disc3, Award, Bot, Radio } from 'lucide-react';
import { PRESET_SONGS } from '../data/presets';
import { SongArtifact } from '../types';

interface NavbarProps {
  activeTab: 'studio' | 'score' | 'cover' | 'agent' | 'benchmarks';
  setActiveTab: (tab: 'studio' | 'score' | 'cover' | 'agent' | 'benchmarks') => void;
  currentSong: SongArtifact;
  onSelectPreset: (presetId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentSong,
  onSelectPreset,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Music2 className="w-5 h-5 text-neutral-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-display">
                  YuE<span className="text-amber-400">2</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Frontier 3B
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Symbolic & Audio Music Generation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'studio'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Studio</span>
            </button>

            <button
              id="tab-score"
              onClick={() => setActiveTab('score')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'score'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Score & ABC</span>
            </button>

            <button
              id="tab-cover"
              onClick={() => setActiveTab('cover')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'cover'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Disc3 className="w-4 h-4" />
              <span>Zero-Shot Cover</span>
            </button>

            <button
              id="tab-agent"
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'agent'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Agentic Edit</span>
            </button>

            <button
              id="tab-benchmarks"
              onClick={() => setActiveTab('benchmarks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'benchmarks'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="hidden md:inline">WildSongBench</span>
              <span className="md:hidden">Arena</span>
            </button>
          </nav>

          {/* Preset Selector */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-neutral-400">Presets:</span>
            <select
              id="preset-selector"
              onChange={(e) => onSelectPreset(e.target.value)}
              value={currentSong.id}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {PRESET_SONGS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
