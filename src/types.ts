export type CotMode = 'full' | 'melody' | 'off';

export interface SongRequest {
  id?: string;
  style: string;
  lyrics: string;
  cot: CotMode;
  seed?: number;
  cfg_scale?: number;
  abc?: string;
}

export interface SongVersion {
  versionId: string;
  timestamp: number;
  label: string;
  instruction: string;
  style: string;
  lyrics: string;
  abc: string;
  audioBase64: string;
  audioUrl?: string;
  bpm: number;
  key: string;
}

export interface SongArtifact {
  id: string;
  title: string;
  style: string;
  lyrics: string;
  cot: CotMode;
  seed: number;
  bpm: number;
  key: string;
  abc: string;
  audioBase64: string;
  audioUrl?: string;
  duration: number;
  createdAt: number;
  versions: SongVersion[];
}

export interface ParsedAbcNote {
  note: string;
  chord?: string;
  durationBeats: number;
  pitchHz: number;
  voice: 'Vocal' | 'Ins';
  barIndex: number;
  lyricsWord?: string;
}

export interface ParsedAbcScore {
  title: string;
  meter: string;
  unitLength: string;
  tempo: number;
  key: string;
  voices: string[];
  notes: ParsedAbcNote[];
  raw: string;
}

export interface BenchmarkRow {
  dataset: string;
  system: string;
  n: number;
  songbench_global_avg: number;
  songbench_musicality: number;
  songeval_global_avg: number;
  songeval_musicality: number;
  audiobox_pq: number;
  mulan: number;
  allmusiccaps: number;
  control_overall: number;
  per: number;
}
