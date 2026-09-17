import { parseAbc } from './abcParser';

// Chord semitone offsets from root
const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7], // major
  'm': [0, 3, 7], // minor
  '7': [0, 4, 7, 10], // dominant 7
  'maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'sus4': [0, 5, 7],
  'dim': [0, 3, 6],
};

const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

function getChordFrequencies(chordName: string): number[] {
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [261.63, 329.63, 392.00];
  const root = match[1];
  const quality = match[2] || '';
  const rootSemitone = NOTE_TO_SEMITONE[root] ?? 0;
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''];

  const baseA4 = 440;
  // Let base octave be C3 (semitone -9 from A4=440 is C4, -21 is C3)
  return intervals.map(interval => {
    const semitoneFromA4 = rootSemitone - 9 - 12 + interval;
    return baseA4 * Math.pow(2, semitoneFromA4 / 12);
  });
}

/**
 * Encodes AudioBuffer into 16-bit PCM WAV format
 */
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * numChannels * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(wavBuffer);

  // Write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // Write fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Interleave channels
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return wavBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Offline render an ABC score to a downloadable/playable WAV AudioBuffer
 */
export async function renderAbcToWav(abc: string, targetDurationSec = 16): Promise<{ wavBlob: Blob; duration: number }> {
  const parsed = parseAbc(abc);
  const tempo = parsed.tempo || 88;
  const secondsPerBeat = 60 / tempo;
  const sampleRate = 44100;

  // Calculate actual duration based on notes
  let totalBeats = 0;
  for (const n of parsed.notes) {
    if (n.voice === 'Vocal') totalBeats += n.durationBeats;
  }
  const calcDuration = Math.max(8, totalBeats > 0 ? totalBeats * secondsPerBeat + 2 : targetDurationSec);
  const duration = Math.min(calcDuration, 30); // keep reasonable for instant render

  // Offline Audio Context
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

  // Reverb simulation via convolver or subtle delay
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.connect(offlineCtx.destination);

  // Schedule notes
  let currentBeat = 0;
  let lastChord = 'C';

  for (const n of parsed.notes) {
    if (n.voice !== 'Vocal') continue;
    const startTime = currentBeat * secondsPerBeat;
    const noteDuration = Math.max(0.1, n.durationBeats * secondsPerBeat * 0.9);

    if (n.chord) {
      lastChord = n.chord;
      // Play warm chord pad
      const chordFreqs = getChordFrequencies(lastChord);
      chordFreqs.forEach(freq => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.min(2.0, noteDuration * 2));

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + Math.min(2.0, noteDuration * 2));
      });

      // Bass note
      const bassFreq = chordFreqs[0] / 2;
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, startTime);
      bassGain.gain.setValueAtTime(0.15, startTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(startTime);
      bassOsc.stop(startTime + noteDuration * 1.5);
    }

    if (n.pitchHz > 20) {
      // Vocal / Lead melody synth
      const osc = offlineCtx.createOscillator();
      const filter = offlineCtx.createBiquadFilter();
      const gain = offlineCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.pitchHz, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, startTime);
      filter.frequency.exponentialRampToValueAtTime(800, startTime + noteDuration);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
      gain.gain.setValueAtTime(0.18, startTime + noteDuration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + noteDuration + 0.05);
    }

    // Light rhythm tick on each beat
    const isQuarterBeat = Math.floor(currentBeat) === currentBeat;
    if (isQuarterBeat) {
      const noiseGain = offlineCtx.createGain();
      const tickOsc = offlineCtx.createOscillator();
      tickOsc.frequency.setValueAtTime(180, startTime);
      tickOsc.frequency.exponentialRampToValueAtTime(40, startTime + 0.04);
      noiseGain.gain.setValueAtTime(0.08, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
      tickOsc.connect(noiseGain);
      noiseGain.connect(masterGain);
      tickOsc.start(startTime);
      tickOsc.stop(startTime + 0.06);
    }

    currentBeat += n.durationBeats;
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavArrayBuffer = audioBufferToWav(renderedBuffer);
  const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

  return { wavBlob, duration };
}
