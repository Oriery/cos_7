import { ref } from 'vue'

const DEFAULT_SAMPLE_RATE = 11060
const DEFAULT_BITS_PER_SAMPLE = 64
export const sampleRate = ref(DEFAULT_SAMPLE_RATE)
export const bitsPerSample = ref(DEFAULT_BITS_PER_SAMPLE)

type Sound = {
  sampleRate: number,
  audioData: Float64Array
}

export class Note {
  id: string;
  startTime: number;
  duration: number;
  wave: Wave;

  [key: string]: any;

  constructor(startTime: number = 0, duration: number = 1, wave = new Wave()) {
    this.id = Math.random().toString(36).slice(2);
    this.startTime = startTime;
    this.duration = duration;
    this.wave = wave;
  }

  toBytes(this: Note, sampleRate: number): Float64Array {
    return this.wave.toBytes(sampleRate, this.duration)
  }

  copy(this: Note) : Note {
    return new Note(this.startTime, this.duration, this.wave.copy())
  }

  get endTime(): number {
    return this.startTime + this.duration;
  }
}

export class Wave {
  id: string;
  amplitude: number;
  amplitudeMod?: Wave;
  type: WaveType;
  freq: number;
  freqMod?: Wave;
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
    fullness: number = 0.5,
    amplitudeMod?: Wave,
    freqMod?: Wave,
  ) {
    this.id = Math.random().toString(36).slice(2);
    this.amplitude = amplitude;
    this.type = type;
    this.freq = freq;
    this.ph0 = ph0;
    this.center = center;
    this.fullness = fullness;
    this.amplitudeMod = amplitudeMod;
    this.freqMod = freqMod;
  }

  toBytes(this: Wave, sampleRate: number, duration: number): Float64Array {
    this.validateFullness();

    const buffer = new Float64Array(sampleRate * duration);
    const dt = 1 / sampleRate;
    if (!this.freqMod) {
      const dPh = this.freq * dt;
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = WAVES_GENERATORS[this.type as WaveType](dPh * i , this.ph0, this.fullness) * this.amplitude + this.center;
      }
    } else {
      const freqModBuffer = this.freqMod.toBytes(sampleRate, duration);
      let phPrev = this.ph0;
      for (let i = 0; i < buffer.length; i++) {
        const dPh = freqModBuffer[i] * dt;
        buffer[i] = WAVES_GENERATORS[this.type as WaveType](dPh, phPrev, this.fullness) * this.amplitude + this.center;
        phPrev = phPrev + 2 * dPh;
      }
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
    return new Wave(this.type, this.amplitude, this.freq, this.ph0, this.center, this.fullness, this.amplitudeMod?.copy(), this.freqMod?.copy())
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
  [WaveType.SINE]: (dPh: number, ph0: number) => Math.sin((2 * dPh + ph0) * Math.PI),
  [WaveType.SQUARE]: (dPh: number, ph0: number, fullness?: number) => {fullness = fullness || 0.5; return Math.sign(Math.sin((2 * dPh - fullness + ph0 + 0.5) * Math.PI) - Math.cos(fullness * Math.PI))},
  [WaveType.SAWTOOTH]: (dPh: number, ph0: number) => 2 * (dPh + 0.5 * ph0 - Math.floor(0.5 + dPh + 0.5 * ph0)),
  [WaveType.TRIANGLE]: (dPh: number, ph0: number) => Math.abs(1 + 4 * dPh + 2 * ph0 - 4 * Math.floor(0.75 + dPh + 0.5 * ph0)) - 1,
  [WaveType.WHITE_NOISE]: () => Math.random() * 2 - 1,
}

export type WaveGenerator = (dPh: number, ph0: number, fullness?: number) => number

export function playNote(note: Note) {
  playBuffer(note.toBytes(sampleRate.value))
}

export type NoteSequence = Note[]

export function playSequence(noteSequence : NoteSequence) : Sound {
  return playBuffer(noteSequenceToBytes(noteSequence))
}

export function noteSequenceToBytes(noteSequence: NoteSequence) : Float64Array {
  const audioBuffer = noteSequence.reduce((acc, note) => {
    const noteBuffer = (note as Note).toBytes(sampleRate.value)
    const offset = note.startTime * sampleRate.value
    // combine buffers
    for (let i = 0; i < noteBuffer.length; i++) {
      acc[i + offset] += noteBuffer[i]
    }
    return acc
  }, new Float64Array(Math.max(...noteSequence.map(note => note.endTime)) * sampleRate.value))

  return audioBuffer
}

export function playBuffer(buffer: Float64Array) : Sound {
  const sound = convertIntoSamplerateAndBitdepth(buffer, sampleRate.value, bitsPerSample.value)

  const audioCtx = new window.AudioContext()
  const source = audioCtx.createBufferSource()
  const audioData = audioCtx.createBuffer(1, sound.audioData.length, sound.sampleRate)
  audioData.copyToChannel(new Float32Array(sound.audioData), 0)

  source.buffer = audioData
  source.connect(audioCtx.destination)
  source.start()

  return sound
}

function convertIntoSamplerateAndBitdepth(buffer: Float64Array, sampleRate: number, bitsPerSample: number) : Sound {
  let sampleRateUsed = sampleRate
  let bufferUsed = buffer
  if (sampleRate < 8000) {
    let { newBuffer, newSampleRate } = convertIntoAtLeast8000SamplesPerSecond(buffer, sampleRate)
    sampleRateUsed = newSampleRate
    bufferUsed = newBuffer
  }

  if (bitsPerSample < Float64Array.BYTES_PER_ELEMENT * 8) {
    bufferUsed =  convertToBitDepth(bufferUsed, bitsPerSample)
  }
  return {
    sampleRate: sampleRateUsed,
    audioData: bufferUsed
  }
}

// because audioCtx.createBuffer can only create buffers with sample rate of more than 8000
function convertIntoAtLeast8000SamplesPerSecond(buffer: Float64Array, sampleRate: number) : {
  newSampleRate: number,
  newBuffer: Float64Array
} {
  if (sampleRate >= 8000) throw new Error('Sample rate is already more than 8000')

  const multiplier = Math.ceil(8000 / sampleRate)
  const newBuffer = new Float64Array(buffer.length * multiplier)
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < multiplier; j++) {
      newBuffer[i * multiplier + j] = buffer[i]
    }
  }
  return {
    newSampleRate: sampleRate * multiplier,
    newBuffer
  }
}

function convertToBitDepth(buffer: Float64Array, bits: number, useDithering: boolean = true): Float64Array {
  const maxValue = Math.pow(2, bits - 1);
  const newBuffer = new Float64Array(buffer.length);
  
  for (let i = 0; i < buffer.length; i++) {
      let sample = buffer[i];

      // Apply dithering
      if (useDithering) {
          const dither = (Math.random() - 0.5) / (maxValue * 2);
          sample += dither;
      }

      // Quantize and then normalize to float between -1 and 1
      sample = Math.round(sample * (maxValue - 1)) / (maxValue - 1);
      newBuffer[i] = Math.max(-1, Math.min(1, sample));
  }
  return newBuffer;
}
