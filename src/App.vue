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
        <div class="flex flex-row align-center gap-2">
          <v-switch
            label="Use FFT"
            v-model="useFft"
            class="-mb-5"
          ></v-switch>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Plot :data="visualizedData.originalSound" title="Sound"/>
        <Plot :data="visualizedData.fourierAmplitude" title="Amplitude spectre" logorithmicScaleAllowed/>
        <v-switch
          label="Show phase spectre"
          v-model="showPhaseSpectre"
          class="-mb-10"
        ></v-switch>
        <Plot v-if="showPhaseSpectre" :data="visualizedData.fourierPhase" title="Phase spectre"/>
        <div class="flex flex-col gap-2">
          <v-switch
            label="Filters"
            v-model="filtersOn"
            class="-mb-10"
          ></v-switch>
          <v-range-slider
            v-if="filtersOn"
            v-model="filterLogRange"
            :min="0"
            :max="Math.log2(maxFrequency)"
            :step="0.01"
            hide-details
            class="align-center"
          >
            <template v-slot:prepend>
              <v-text-field
                :model-value="filterRange[0].toPrecision(5)"
                hide-details
                single-line
                type="number"
                variant="outlined"
                density="compact"
                class="w-[8rem]"
                @change="filterLogRange = [Math.log2(Number($event.target.value)), filterLogRange[1]]"
              ></v-text-field>
            </template>
            <template v-slot:append>
              <v-text-field
                :model-value="filterRange[1].toPrecision(5)"
                hide-details
                single-line
                type="number"
                variant="outlined"
                density="compact"
                class="w-[8rem]"
                @change="filterLogRange = [filterLogRange[0], Math.log2(Number($event.target.value))]"
              ></v-text-field>
            </template>
          </v-range-slider>
          <v-btn @click="doInverseWithFilterAndPlay" color="green">Do inverse with filter and play</v-btn>
          <Plot :data="visualizedData.inversedSound" title="Inversed from Fourier + Filters"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref, computed } from 'vue'
import NoteComponent from './components/Note.vue'
import { Note, Wave, WaveType, playSequence, NoteSequence, sampleRate, bitsPerSample, playBuffer } from './types/notes'
import Plot from './components/Plot.vue';
import { fourierTransform, fastFourierTransform, inverseFourierTransform, bandpassFilter } from './types/fourier';
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

const maxFrequency = ref(22000)
const filterLogRange = ref([Math.log2(200), Math.log2(300)])
const filterRange = computed(() => [2 ** filterLogRange.value[0], 2 ** filterLogRange.value[1]])
const filtersOn = ref(false)

const showPhaseSpectre = ref(false)

const useFft = ref(true)
let lastUseWasFft = false

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

  if (!same || lastUseWasFft !== useFft.value) {
    if (useFft.value) {
      console.time('FFT')
      fourierResult = fastFourierTransform(playedSound.audioData)
      console.timeEnd('FFT')
      lastUseWasFft = true
    } else {
      console.time('DFT')
      fourierResult = fourierTransform(playedSound.audioData)
      console.timeEnd('DFT')
      lastUseWasFft = false
    }

    visualizedData.fourierAmplitude.ref.value = fourierResult.amplitude
    visualizedData.fourierPhase.ref.value = fourierResult.phase
  }

  visualizedData.originalSound.ref.value = playedSound.audioData 
}

function doInverseWithFilterAndPlay() {
  let fourier
  if (filtersOn.value) {
    console.time('bandpassFilter')
    fourier = bandpassFilter(fourierResult, sampleRate.value, filterRange.value[0], filterRange.value[1])
    console.timeEnd('bandpassFilter')
  } else {
    fourier = fourierResult
  }

  console.time('inverseFourier')
  let inversed = inverseFourierTransform(fourier.realParts, fourier.imagParts)
  console.timeEnd('inverseFourier')

  // cut to original length
  inversed = inversed.slice(0, visualizedData.originalSound.ref.value.length)

  visualizedData.inversedSound.ref.value = inversed

  playBuffer(visualizedData.inversedSound.ref.value)
}

</script>
