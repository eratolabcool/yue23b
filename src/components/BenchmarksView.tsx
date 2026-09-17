import React, { useState } from 'react';
import { Award, Radio, Trophy, CheckCircle, BarChart3, ThumbsUp, HelpCircle } from 'lucide-react';
import { BENCHMARK_METRICS, BENCHMARK_ROWS, ARENA_CLIPS, ArenaClip } from '../data/benchmarks';

interface BenchmarksViewProps {
  onVoteArena: (clipId: string, choice: 'a' | 'b' | 'tie') => Promise<void>;
}

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({ onVoteArena }) => {
  const [selectedMetric, setSelectedMetric] = useState('songbench_global_avg');
  const [votedClips, setVotedClips] = useState<Record<string, 'a' | 'b' | 'tie'>>({});
  const [activeClipId, setActiveClipId] = useState(ARENA_CLIPS[0].id);

  const activeClip = ARENA_CLIPS.find((c) => c.id === activeClipId) || ARENA_CLIPS[0];

  const handleVote = async (choice: 'a' | 'b' | 'tie') => {
    if (votedClips[activeClip.id]) return;
    setVotedClips((prev) => ({ ...prev, [activeClip.id]: choice }));
    await onVoteArena(activeClip.id, choice);
  };

  // Sort rows by selected metric
  const sortedRows = [...BENCHMARK_ROWS].sort((a, b) => {
    const valA = (a as any)[selectedMetric] || 0;
    const valB = (b as any)[selectedMetric] || 0;
    return valB - valA;
  });

  const maxVal = Math.max(...BENCHMARK_ROWS.map((r) => (r as any)[selectedMetric] || 0));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>WildSongBench Evaluation</span>
            </span>
            <span className="text-xs text-neutral-400">192 prompts · 15 comparator systems</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            WildSongBench Results & Blind Music Arena
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            YuE2 (best-of-8) achieves 6.9632 SongBench Avg, the highest observed mean among evaluated open and proprietary systems.
          </p>
        </div>
      </div>

      {/* Section 1: Music Arena A/B Listening Test */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Music Arena: Blind A/B Listening</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Listen to anonymized musical renderings generated from the same prompt and vote for the better song.
            </p>
          </div>

          <div className="flex gap-2">
            {ARENA_CLIPS.map((clip, idx) => (
              <button
                key={clip.id}
                onClick={() => setActiveClipId(clip.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeClipId === clip.id
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Match #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Active Match Arena Card */}
        <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
          <div>
            <h4 className="font-semibold text-white text-base">{activeClip.title}</h4>
            <p className="text-xs text-neutral-400 mt-1">
              <span className="text-neutral-500">Prompt Style:</span> {activeClip.style}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              <span className="text-neutral-500">Lyrics:</span> "{activeClip.lyricsSnippet}"
            </p>
          </div>

          {/* Blind A & B Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-200">System A</span>
                {votedClips[activeClip.id] && (
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                    {activeClip.systemA}
                  </span>
                )}
              </div>
              <div className="h-10 rounded-lg bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
                Audition Audio Stream A
              </div>
              <button
                onClick={() => handleVote('a')}
                disabled={!!votedClips[activeClip.id]}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-xs font-semibold transition text-neutral-200"
              >
                {votedClips[activeClip.id] === 'a' ? '✓ You Voted for A' : 'Vote System A'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-200">System B</span>
                {votedClips[activeClip.id] && (
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                    {activeClip.systemB}
                  </span>
                )}
              </div>
              <div className="h-10 rounded-lg bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
                Audition Audio Stream B
              </div>
              <button
                onClick={() => handleVote('b')}
                disabled={!!votedClips[activeClip.id]}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-xs font-semibold transition text-neutral-200"
              >
                {votedClips[activeClip.id] === 'b' ? '✓ You Voted for B' : 'Vote System B'}
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => handleVote('tie')}
              disabled={!!votedClips[activeClip.id]}
              className="px-6 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
            >
              {votedClips[activeClip.id] === 'tie' ? '✓ You Voted Tie' : 'It is a Tie / Both are Equal'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Official WildSongBench Leaderboard */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">WildSongBench Benchmark Matrix</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Empirical scores across 192 prompts evaluating musicality, text alignment, and audio production fidelity.
            </p>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Sort by Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {BENCHMARK_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Comparison Bars */}
        <div className="space-y-3">
          {sortedRows.map((row, idx) => {
            const val = (row as any)[selectedMetric] || 0;
            const percent = (val / maxVal) * 100;
            const isYuE = row.system.startsWith('YuE');

            return (
              <div
                key={row.system}
                className={`p-3 rounded-xl border transition ${
                  isYuE
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-neutral-800/80 bg-neutral-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-500 w-5">#{idx + 1}</span>
                    <span className={`font-semibold ${isYuE ? 'text-amber-400 font-bold' : 'text-neutral-200'}`}>
                      {row.system}
                    </span>
                    {isYuE && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                        YuE2 SOTA
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-neutral-100">
                    {typeof val === 'number' ? val.toFixed(3) : val}
                  </span>
                </div>

                <div className="w-full bg-neutral-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isYuE ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-neutral-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
