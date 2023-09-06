<template>
  <div>
    <h2 class="text-xl">Sound Maker</h2>
    <div>
      <h2 class="text-lg">Notes:</h2>
      <div class="flex flex-wrap">
        <div
          v-for="note in noteSequence"
          :key="note.id"
          class="border-2 rounded-lg m-1"
        >
          <select
            v-model="note.wave.type"
            class="m-1"
          >
            <option
              v-for="waveType in Object.values(WaveType)"
              :key="waveType"
              :value="waveType"
            >
              {{ waveType }}
            </option>
          </select>
          <div 
            v-for="prop in Object.keys(note).map(prop => prop.startsWith('_') ? prop.slice(1) : prop).filter((prop) => prop !== 'id' && prop !== 'endTime' && typeof note[prop] === 'number')"
            :key="prop"
            class="flex flex-col m-1">
            <label :for="prop">{{ prop }}</label>
            <input
              :name="prop"
              :value="note[prop]"
              @input="note[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
              type="number"
            >
          </div>
          <div 
            v-for="prop in Object.keys(note.wave).filter(prop => typeof note.wave[prop] === 'number')"
            :key="prop"
            class="flex flex-col m-1">
            <label :for="prop">{{ prop }}</label>
            <input
              :name="prop"
              :value="note.wave[prop]"
              @input="note.wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
              type="number"
            >
          </div>
          <button
            @click="playNote(note as Note)"
            class="bg-green-500 m-2 p-2"
          >
            Play
          </button>
          <button
            @click="noteSequence = noteSequence.filter(n => n.id !== note.id)"
            class="bg-red-500 m-2 p-2"
          >
            Delete
          </button>
        </div>
      </div>
      <button 
        @click="() => noteSequence.push(new Note())"
        class="bg-gray-500 m-2 p-2"
      >
        Create Note
      </button>
      <button 
        @click="() => noteSequence = []"
        class="bg-red-500 m-2 p-2"
      >
        Clear
      </button>
      <button 
        @click="playSequence"
        class="bg-green-500 m-2 p-2"
      >
        Play Sequence
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'

const SAMPLE_RATE = 44100

class Note {
  private _id: string;
  private _startTime: number;
  private _duration: number;
  private _endTime: number;
  wave: Wave;

  [key: string]: number | Wave | string;

  constructor(startTime: number = 0, duration: number = 1, wave: Wave = {
    amplitude: 0.5,
    type: WaveType.SINE,
    freq: 220,
  }) {
    this._id = String(Math.random());
    this._startTime = startTime;
    this._duration = duration;
    this._endTime = startTime + duration;
    this.wave = wave;
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

type Wave = {
  amplitude: number
  type: WaveType
  freq: number
  [key: string]: number | string | WaveType
}

enum WaveType {
  SINE = 'sine',
  SQUARE = 'square',
  SAWTOOTH = 'sawtooth',
  TRIANGLE = 'triangle',
  WHITE_NOISE = 'white-noise',
}

const WAVES_GENERATORS : {
  [key in WaveType]: WaveGenerator
} = {
  [WaveType.SINE]: (freq: number, t: number, ph0: number) => Math.sin(2 * Math.PI * freq * t + ph0),
  [WaveType.SQUARE]: (freq: number, t: number, ph0: number) => Math.sign(Math.sin(2 * Math.PI * freq * t + ph0)),
  [WaveType.SAWTOOTH]: (freq: number, t: number, ph0: number) => 2 * (t * freq + ph0 - Math.floor(0.5 + t * freq + ph0)),
  [WaveType.TRIANGLE]: (freq: number, t: number, ph0: number) => Math.abs(2 * (t * freq + ph0 - Math.floor(0.5 + t * freq + ph0))) - 1,
  [WaveType.WHITE_NOISE]: () => Math.random() * 2 - 1,
}

type WaveGenerator = (freq: number, t: number, ph0: number) => number

const noteSequence = ref<Note[]>([])

noteSequence.value.push(new Note(0, 2, {
  type: WaveType.SINE,
  freq: 220,
  amplitude: 0.5,
}))
noteSequence.value.push(new Note(0.5, 1, {
  type: WaveType.SAWTOOTH,
  freq: 110,
  amplitude: 0.3,
}))
noteSequence.value.push(new Note(1.5, 1, {
  type: WaveType.SAWTOOTH,
  freq: 130,
  amplitude: 0.3,
}))
noteSequence.value.push(new Note(2.5, 1, {
  type: WaveType.SAWTOOTH,
  freq: 98,
  amplitude: 0.3,
}))

function generateNote(note: Note, sampleRate: number) {
  return generateWave(note.wave, note.duration, sampleRate)
}

function generateWave(wave: Wave, duration: number, sampleRate: number) {
  const type = wave.type
  const freq = wave.freq

  const buffer = new Float32Array(duration * sampleRate)
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = WAVES_GENERATORS[type](freq, i / sampleRate, 0) * wave.amplitude
  }
  return buffer
}

function playNote(note: Note) {
  const audioBuffer = generateWave(note.wave, note.duration, SAMPLE_RATE)
  playBuffer(audioBuffer)
}

function playSequence() {
  if (!noteSequence.value.length) {
    console.warn('No notes to play')
    return
  }

  const audioBuffer = noteSequence.value.reduce((acc, note) => {
    const noteBuffer = generateNote(note as Note, SAMPLE_RATE)
    const offset = note.startTime * SAMPLE_RATE
    // combine buffers
    for (let i = 0; i < noteBuffer.length; i++) {
      acc[i + offset] += noteBuffer[i]
    }
    return acc
  }, new Float32Array(Math.max(...noteSequence.value.map(note => note.endTime)) * SAMPLE_RATE))

  playBuffer(audioBuffer)
}

function playBuffer(buffer: Float32Array) {
  const audioCtx = new window.AudioContext()
  const source = audioCtx.createBufferSource()
  const audioData = audioCtx.createBuffer(1, buffer.length, SAMPLE_RATE)
  audioData.copyToChannel(buffer, 0)

  source.buffer = audioData
  source.connect(audioCtx.destination)
  source.start()
}

</script>
