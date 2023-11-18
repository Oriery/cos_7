<template>
  <div>
    <h2 class="text-xl">Sound Maker</h2>
    <div class="flex flex-col gap-2">
      <h2 class="text-lg text-start">Notes:</h2>
      <div class="flex flex-wrap">
        <NoteComponent 
          v-for="note in noteSequence"
          :key="note.id"
          :note="(note as Note)"
          @delete-note="noteSequence.splice(noteSequence.indexOf(note), 1)"
          @duplicate-note="duplicateNote"
        />
      </div>
      <div class="flex flex-row gap-2">
        <button 
          @click="createNote"
          class="bg-gray-500 p-2"
        >
          Create Note
        </button>
        <button 
          @click="() => noteSequence = []"
          class="bg-red-500 p-2"
        >
          Clear
        </button>
        <button 
          @click="() => play(noteSequence as NoteSequence)"
          class="bg-green-500 p-2"
        >
          Play Sequence
        </button>
        <button 
          @click="resetNoteSequence"
          class="bg-blue-500 p-2"
        >
          Reset To Default
        </button>
      </div>
      <div class="flex flex-row gap-8">
        <div class="flex flex-row align-center gap-2">
          Sample rate:
          <v-text-field
            v-model="sampleRate"
            hide-details
            single-line
            density="compact"
            type="number"
            class="w-[12rem]"
          ></v-text-field>
        </div>
        <div class="flex flex-row align-center gap-2">
          Bits per sample:
          <v-text-field
            v-model="bitsPerSample"
            hide-details
            single-line
            density="compact"
            type="number"
            class="w-[12rem]"
          ></v-text-field>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Plot :data="visualizedData.originalSound" title="Sound"/>
        <Plot :data="visualizedData.fourierAmplitude" title="Amplitude spectre" logorithmicScaleAllowed/>
        <Plot :data="visualizedData.fourierPhase" title="Phase spectre"/>
        <div class="flex flex-col gap-2">
          <div class="flex flex-row gap-2 align-center">
            Filter min:
            <v-text-field
              v-model="filterMin"
              hide-details
              single-line
              density="compact"
              type="number"
              class="w-[12rem]"
            ></v-text-field>
          </div>
          <div class="flex flex-row gap-2 align-center">
            Filter max:
            <v-text-field
              v-model="filterMax"
              hide-details
              single-line
              density="compact"
              type="number"
              class="w-[12rem]"
            ></v-text-field>
          </div>
          <v-btn @click="doInverseWithFilterAndPlay" color="green">Do inverse with filter and play</v-btn>
          <Plot :data="visualizedData.inversedSound" title="Inversed from Fourier + Filters"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import NoteComponent from './components/Note.vue'
import { Note, Wave, WaveType, playSequence, NoteSequence, sampleRate, bitsPerSample, playBuffer } from './types/notes'
import Plot from './components/Plot.vue';
import { fourierTransform, inverseFourierTransform, bandpassFilter } from './types/fourier';
import type { FourierResult } from './types/fourier';

const visualizedData = {
  originalSound: {ref: ref(new Float64Array(0)) },
  fourierAmplitude: {ref: ref(new Float64Array(0)) },
  fourierPhase: {ref: ref(new Float64Array(0)) },
  inversedSound: {ref: ref(new Float64Array(0)) },
}
let fourierResult : FourierResult = {
  amplitude: new Float64Array(0),
  phase: new Float64Array(0),
  imagParts: new Float64Array(0),
  realParts: new Float64Array(0),
}

const filterMin = ref(200)
const filterMax = ref(300)

const noteSequence = ref<NoteSequence>([])

resetNoteSequence()

function resetNoteSequence() {
  noteSequence.value = []
  noteSequence.value.push(new Note(0, 1, new Wave(
    WaveType.SINE,
    1,
    220,
    undefined,
    undefined,
    undefined,
    new Wave(
      WaveType.SINE,
      0.5,
      20,
      -0.5,
      0.5,
      undefined,
      new Wave(
        WaveType.SINE,
        0.5,
        4,
        -0.5,
        0.5,
      )
    )
  )))
  noteSequence.value.push(new Note(0.5, 0.5, new Wave(
    WaveType.SQUARE,
    0.1,
    110,
    undefined,
    undefined,
    undefined,
    new Wave(
      WaveType.SQUARE,
      0.5,
      8,
      0,
      0.5,
    ),
    new Wave(
      WaveType.SAWTOOTH,
      77.78,
      4,
      1,
      220,
    )
  )))
}

function duplicateNote(note: Note) {
  noteSequence.value.splice(noteSequence.value.indexOf(note), 0, note.copy())
}

function createNote() {
  console.log('create note')
  noteSequence.value.push(new Note())
}

function play(noteSequence : NoteSequence) {
  const playedSound = playSequence(noteSequence)

  // if the same values, then we don't need to recalculate Fourier transform
  let same = true
  if (visualizedData.originalSound.ref.value.length === playedSound.audioData.length) {
    for (let i = 0; i < visualizedData.originalSound.ref.value.length; i++) {
      if (visualizedData.originalSound.ref.value[i] !== playedSound.audioData[i]) {
        same = false
        break
      }
    }
  } else {
    same = false
  }

  if (!same) {
    console.time('fourier')
    fourierResult = fourierTransform(playedSound.audioData)
    console.timeEnd('fourier')

    visualizedData.fourierAmplitude.ref.value = fourierResult.amplitude
    visualizedData.fourierPhase.ref.value = fourierResult.phase
  }

  visualizedData.originalSound.ref.value = playedSound.audioData 
}

function doInverseWithFilterAndPlay() {
  console.time('bandpassFilter')
  const filteredFourier = bandpassFilter(fourierResult, sampleRate.value, filterMin.value, filterMax.value)
  console.timeEnd('bandpassFilter')

  console.time('inverseFourier')
  const inversed = inverseFourierTransform(filteredFourier.realParts, filteredFourier.imagParts)
  console.timeEnd('inverseFourier')
  visualizedData.inversedSound.ref.value = inversed

  playBuffer(visualizedData.inversedSound.ref.value)
}

</script>
