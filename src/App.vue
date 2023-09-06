<template>
  <div>
    <h2 class="text-xl">Make sounds:</h2>
    <div class="flex flex-col">
      <button 
        v-for="waveType in Object.values(WaveType)" 
        :key="waveType" 
        @click="playSound(waveType)" 
      >
        {{ waveType }}
      </button>
    </div>
    <div>
      <h2 class="text-xl">Notes:</h2>
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
              @input="note[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
              type="number"
            >
          </div>
          <button
            @click="playSound(note.wave.type, note.wave.freq, note.duration)"
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

  set endTime(value: number) {
    this._endTime = value;
    this._duration = this._endTime - this._startTime;
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
  [WaveType.SINE]: (freq: number, sampleRate: number, i: number) => Math.sin(2 * Math.PI * freq * i / sampleRate),
  [WaveType.SQUARE]: (freq: number, sampleRate: number, i: number) => Math.sign(Math.sin(2 * Math.PI * freq * i / sampleRate)),
  [WaveType.SAWTOOTH]: (freq: number, sampleRate: number, i: number) => 2 * (i / sampleRate * freq - Math.floor(0.5 + i / sampleRate * freq)),
  [WaveType.TRIANGLE]: (freq: number, sampleRate: number, i: number) => Math.abs(2 * (i / sampleRate * freq - Math.floor(0.5 + i / sampleRate * freq))) - 1,
  [WaveType.WHITE_NOISE]: () => Math.random() * 2 - 1,
}

type WaveGenerator = (freq: number, sampleRate: number, i: number) => number

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

function generateWave(type: WaveType, freq: number, duration: number, sampleRate: number) {
  const buffer = new Float32Array(duration * sampleRate)
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = WAVES_GENERATORS[type](freq, sampleRate, i)
  }
  return buffer
}

function playSound(type: WaveType, freq: number = 440, duration: number = 1) {
  const audioBuffer = generateWave(type, freq, duration, SAMPLE_RATE)

  const audioCtx = new window.AudioContext()
  const source = audioCtx.createBufferSource()
  const audioData = audioCtx.createBuffer(1, audioBuffer.length, SAMPLE_RATE)
  audioData.copyToChannel(audioBuffer, 0)

  source.buffer = audioData
  source.connect(audioCtx.destination)
  source.start()
}

function playSequence() {
  if (!noteSequence.value.length) {
    console.warn('No notes to play')
    return
  }

  const audioCtx = new window.AudioContext()
  const audioData = audioCtx.createBuffer(1, Math.max(...noteSequence.value.map(note => note.endTime)) * SAMPLE_RATE, SAMPLE_RATE)
  const audioBuffer = audioData.getChannelData(0)

  noteSequence.value.forEach(note => {
    const noteBuffer = generateWave(note.wave.type, note.wave.freq, note.duration, SAMPLE_RATE)
    const startPos_in_audioBuffer = note.startTime * SAMPLE_RATE
    for (let j = 0; j < noteBuffer.length; j++) {
      audioBuffer[startPos_in_audioBuffer + j] = note.wave.amplitude * noteBuffer[j] + (audioBuffer[startPos_in_audioBuffer + j] || 0)
    }
  })

  const source = audioCtx.createBufferSource()
  source.buffer = audioData
  source.connect(audioCtx.destination)
  source.start()
}

</script>
