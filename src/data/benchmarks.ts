import { BenchmarkRow } from '../types';

export const BENCHMARK_METRICS = [
  { key: 'songbench_global_avg', label: 'SongBench Avg', description: '7-dimension global quality rating', max: 10 },
  { key: 'songbench_musicality', label: 'Musicality', description: 'SongBench musical structure & harmony', max: 10 },
  { key: 'songeval_global_avg', label: 'SongEval', description: '5-dimension holistic song evaluation', max: 5 },
  { key: 'audiobox_pq', label: 'AudioBox PQ', description: 'Production audio fidelity score', max: 10 },
  { key: 'mulan', label: 'MuLan Similarity', description: 'Style & audio text-alignment similarity', max: 1 },
  { key: 'control_overall', label: 'Prompt Control', description: 'Weighted prompt adherence', max: 5 },
  { key: 'per', label: 'Phoneme Error (PER)', description: 'Lyric vocal pronunciation error (lower is better)', max: 1, lowerIsBetter: true }
];

export const BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    dataset: 'WSB',
    system: 'YuE2 (best-of-8)',
    n: 192,
    songbench_global_avg: 6.963,
    songbench_musicality: 6.267,
    songeval_global_avg: 4.296,
    songeval_musicality: 4.251,
    audiobox_pq: 8.271,
    mulan: 0.505,
    allmusiccaps: 0.398,
    control_overall: 4.701,
    per: 0.098
  },
  {
    dataset: 'WSB',
    system: 'YuE2',
    n: 192,
    songbench_global_avg: 6.732,
    songbench_musicality: 5.907,
    songeval_global_avg: 4.262,
    songeval_musicality: 4.215,
    audiobox_pq: 8.260,
    mulan: 0.507,
    allmusiccaps: 0.405,
    control_overall: 4.682,
    per: 0.084
  },
  {
    dataset: 'WSB',
    system: 'ACE-Step 1.5',
    n: 192,
    songbench_global_avg: 6.012,
    songbench_musicality: 5.159,
    songeval_global_avg: 3.846,
    songeval_musicality: 3.805,
    audiobox_pq: 8.052,
    mulan: 0.437,
    allmusiccaps: 0.387,
    control_overall: 4.581,
    per: 0.075
  },
  {
    dataset: 'WSB',
    system: 'Suno v4',
    n: 192,
    songbench_global_avg: 6.680,
    songbench_musicality: 5.890,
    songeval_global_avg: 4.190,
    songeval_musicality: 4.120,
    audiobox_pq: 8.190,
    mulan: 0.490,
    allmusiccaps: 0.395,
    control_overall: 4.620,
    per: 0.092
  },
  {
    dataset: 'WSB',
    system: 'Suno v3.5',
    n: 192,
    songbench_global_avg: 6.410,
    songbench_musicality: 5.620,
    songeval_global_avg: 4.020,
    songeval_musicality: 3.980,
    audiobox_pq: 8.010,
    mulan: 0.460,
    allmusiccaps: 0.370,
    control_overall: 4.510,
    per: 0.105
  },
  {
    dataset: 'WSB',
    system: 'Udio v1.5',
    n: 192,
    songbench_global_avg: 6.550,
    songbench_musicality: 5.750,
    songeval_global_avg: 4.110,
    songeval_musicality: 4.080,
    audiobox_pq: 8.150,
    mulan: 0.485,
    allmusiccaps: 0.390,
    control_overall: 4.590,
    per: 0.095
  }
];

export interface ArenaClip {
  id: string;
  title: string;
  style: string;
  lyricsSnippet: string;
  systemA: string;
  systemB: string;
  votesA: number;
  votesB: number;
  votesTie: number;
}

export const ARENA_CLIPS: ArenaClip[] = [
  {
    id: 'clip_1',
    title: 'Neon Skyway (Synthwave Vocal)',
    style: '1980s synthwave, energetic female vocals, analog synth leads, 120 BPM',
    lyricsSnippet: 'Hold on through the digital rain / We will never be the same',
    systemA: 'YuE2 (Symbolic Plan)',
    systemB: 'Proprietary Commercial Model',
    votesA: 342,
    votesB: 218,
    votesTie: 85
  },
  {
    id: 'clip_2',
    title: 'Lakeside Reflections (Piano Ballad)',
    style: 'Acoustic grand piano, melancholic tenor, emotional vibrato, 72 BPM',
    lyricsSnippet: 'Water mirrors what the shadows hide / Silence waiting on the other side',
    systemA: 'YuE2 (best-of-8)',
    systemB: 'Leading Audio Diffusion SOTA',
    votesA: 412,
    votesB: 289,
    votesTie: 110
  },
  {
    id: 'clip_3',
    title: 'Autumn in Brooklyn (Jazz Trio)',
    style: 'Mellow upright bass, hollow-body archtop guitar, brushed snare, 96 BPM',
    lyricsSnippet: 'Leaves are turning on the avenue / Golden afternoon with you',
    systemA: 'YuE2 (Zero-shot Reharmonization)',
    systemB: 'End-to-End Audio LM',
    votesA: 388,
    votesB: 245,
    votesTie: 92
  }
];
