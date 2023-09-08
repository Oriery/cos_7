const SAMPLE_RATE = 44100

export class Note {
  private _id: string;
  private _startTime: number;
  private _duration: number;
  private _endTime: number;
  wave: Wave;

  [key: string]: any;

  constructor(startTime: number = 0, duration: number = 1, wave = new Wave()) {
    this._id = Math.random().toString(36).slice(2);
    this._startTime = startTime;
    this._duration = duration;
    this._endTime = startTime + duration;
    this.wave = wave;
  }

  toBytes(this: Note, sampleRate: number): Float32Array {
    return this.wave.toBytes(sampleRate, this.duration)
  }

  copy(this: Note) : Note {
    return new Note(this.startTime, this.duration, this.wave.copy())
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get startTime(): number {
    return this._startTime;
  }

  set startTime(value: number) {
    this._startTime = value;
    this._endTime = this._startTime + this._duration;
  }

  get duration(): number {
    return this._duration;
  }

  set duration(value: number) {
    this._duration = value;
    this._endTime = this._startTime + this._duration;
  }

  get endTime(): number {
    return this._endTime;
  }
}

export class Wave {
  id: string;
  amplitude: number;
  amplitudeMod?: Wave;
  type: WaveType;
  freq: number;
  ph0: number;
  fullness: number; // 0 - 1 – For square wave
  center: number; // where "zero" of the wave is
  [key: string]: any;

  constructor(
    type: WaveType = WaveType.SINE,
    amplitude: number = 0.5,
    freq: number = 220,
    ph0: number = 0,
    center: number = 0,
    fullness?: number,
    amplitudeMod?: Wave,
  ) {
    this.id = Math.random().toString(36).slice(2);
    this.amplitude = amplitude;
    this.type = type;
    this.freq = freq;
    this.ph0 = ph0;
    this.center = center;
    this.fullness = fullness || 0.5;
    this.amplitudeMod = amplitudeMod;
  }

  toBytes(this: Wave, sampleRate: number, duration: number): Float32Array {
    this.validateFullness();

    const buffer = new Float32Array(sampleRate * duration);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = WAVES_GENERATORS[this.type as WaveType](this.freq, i / sampleRate, this.ph0, this.fullness) * this.amplitude + this.center;
    }

    const amplitudeModBuffer = this.amplitudeMod?.toBytes(sampleRate, duration);
    if (amplitudeModBuffer) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= amplitudeModBuffer[i];
      }
    }
    return buffer;
  }

  validateFullness(this: Wave) : boolean {
    return this.fullness >= 0 && this.fullness <= 1;
  }

  copy(this: Wave) : Wave {
    return new Wave(this.type, this.amplitude, this.freq, this.ph0, this.center, this.fullness, this.amplitudeMod?.copy())
  }
}

export enum WaveType {
  SINE = 'sine',
  SQUARE = 'square',
  SAWTOOTH = 'sawtooth',
  TRIANGLE = 'triangle',
  WHITE_NOISE = 'white-noise',
}

export const WAVES_GENERATORS : {
  [key in WaveType]: WaveGenerator
} = {
  [WaveType.SINE]: (freq: number, t: number, ph0: number) => Math.sin((2 * freq * t + ph0) * Math.PI),
  [WaveType.SQUARE]: (freq: number, t: number, ph0: number, fullness?: number) => {fullness = fullness || 0.5; return Math.sign(Math.sin((2 * freq * t - fullness + ph0 + 0.5) * Math.PI) - Math.cos(fullness * Math.PI))},
  [WaveType.SAWTOOTH]: (freq: number, t: number, ph0: number) => 2 * (t * freq + 0.5 * ph0 - Math.floor(0.5 + t * freq + 0.5 * ph0)),
  [WaveType.TRIANGLE]: (freq: number, t: number, ph0: number) => Math.abs(2 * (0.25 + t * freq + 0.5 * ph0 - Math.floor(0.75 + t * freq + 0.5 * ph0))) - 1,
  [WaveType.WHITE_NOISE]: () => Math.random() * 2 - 1,
}

export type WaveGenerator = (freq: number, t: number, ph0: number, fullness?: number) => number

export function playNote(note: Note) {
  playBuffer(note.toBytes(SAMPLE_RATE))
}

export type NoteSequence = Note[]

export function playSequence(noteSequence : NoteSequence) {
  if (!noteSequence.length) {
    console.warn('No notes to play')
    return
  }

  const audioBuffer = noteSequence.reduce((acc, note) => {
    const noteBuffer = (note as Note).toBytes(SAMPLE_RATE)
    const offset = note.startTime * SAMPLE_RATE
    // combine buffers
    for (let i = 0; i < noteBuffer.length; i++) {
      acc[i + offset] += noteBuffer[i]
    }
    return acc
  }, new Float32Array(Math.max(...noteSequence.map(note => note.endTime)) * SAMPLE_RATE))

  playBuffer(audioBuffer)
}

export function playBuffer(buffer: Float32Array) {
  const audioCtx = new window.AudioContext()
  const source = audioCtx.createBufferSource()
  const audioData = audioCtx.createBuffer(1, buffer.length, SAMPLE_RATE)
  audioData.copyToChannel(buffer, 0)

  source.buffer = audioData
  source.connect(audioCtx.destination)
  source.start()
}