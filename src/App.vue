<template>
  <div>
    <h2 class="text-xl">Make sounds:</h2>
    <div class="flex flex-col">
      <button 
        v-for="waveType in Object.values(WaveType)" 
        :key="waveType" 
        @click="playSound(waveType)" 
        class="">
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
            v-model="note.waveType"
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
            v-for="prop in Object.keys(note).filter(prop => prop !== 'id' && typeof note[prop] === 'number')"
            :key="prop"
            class="flex flex-col m-1">
            <label :for="prop">{{ prop }}</label>
            <input
              :name="prop"
              :value="note[prop]"
              @input="note[prop] = Number($event.target.value)"
              type="number"
            >
          </div>
          <button
            @click="playSound(note.waveType, note.freq, note.duration)"
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
        @click="() => noteSequence.push({
          id: String(Math.random()),
          waveType: WaveType.SINE,
          freq: 440,
          startTime: 0,
          duration: 1,
          amplitude: 0.5,
        })"
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

import { ref } from 'vue';

const SAMPLE_RATE = 44100;

type Note = {
  id: string;
  waveType: WaveType;
  freq: number;
  startTime: number;
  duration: number;
  amplitude: number;
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

type WaveGenerator = (freq: number, sampleRate: number, i: number) => number;

const noteSequence = ref<Note[]>([{
    id: '1',
    waveType: WaveType.SINE,
    freq: 220,
    startTime: 0,
    duration: 2,
    amplitude: 0.5,
  }, 
  {
    id: '2',
    waveType: WaveType.SAWTOOTH,
    freq: 110,
    startTime: 0.5,
    duration: 1,
    amplitude: 0.5,
  },
  {
    id: '3',
    waveType: WaveType.SAWTOOTH,
    freq: 130,
    startTime: 1.5,
    duration: 1,
    amplitude: 0.3,
  },
  {
    id: '4',
    waveType: WaveType.SAWTOOTH,
    freq: 98,
    startTime: 2.5,
    duration: 1,
    amplitude: 0.3,
  },
]);

function generateWave(waveType: WaveType, freq: number, duration: number, sampleRate: number) {
  const buffer = new Float32Array(duration * sampleRate);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = WAVES_GENERATORS[waveType](freq, sampleRate, i);
  }
  return buffer;
};

function playSound(waveType: WaveType, freq: number = 440, duration: number = 1) {
  const audioBuffer = generateWave(waveType, freq, duration, SAMPLE_RATE);

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createBufferSource();
  const audioData = audioCtx.createBuffer(1, audioBuffer.length, SAMPLE_RATE);
  audioData.copyToChannel(audioBuffer, 0);

  source.buffer = audioData;
  source.connect(audioCtx.destination);
  source.start();
};

function playSequence() {
  if (!noteSequence.value.length) {
    console.warn('No notes to play');
    return;
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioData = audioCtx.createBuffer(1, noteSequence.value.reduce((max : number, note : Note) => Math.max(max, note.startTime + note.duration), 0) * SAMPLE_RATE, SAMPLE_RATE);
  const audioBuffer = audioData.getChannelData(0);

  noteSequence.value.forEach((note : Note) => {
    const noteBuffer = generateWave(note.waveType, note.freq, note.duration, SAMPLE_RATE);
    const startPos_in_audioBuffer = note.startTime * SAMPLE_RATE;
    for (let j = 0; j < noteBuffer.length; j++) {
      audioBuffer[startPos_in_audioBuffer + j] = note.amplitude * noteBuffer[j] + (audioBuffer[startPos_in_audioBuffer + j] || 0);
    }
  });

  const source = audioCtx.createBufferSource();
  source.buffer = audioData;
  source.connect(audioCtx.destination);
  source.start();
};

</script>
