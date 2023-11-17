<template>
  <div>
    <h2 class="text-xl">Sound Maker</h2>
    <div class="flex flex-col gap-2">
      <h2 class="text-lg">Notes:</h2>
      <div class="flex flex-wrap justify-center">
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
      <Plot :data="visualizedData"/>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import NoteComponent from './components/Note.vue'
import { Note, Wave, WaveType, playSequence, NoteSequence, sampleRate, bitsPerSample } from './types/notes'
import Plot from './components/Plot.vue';
const visualizedData = {ref: ref<Float64Array>(new Float64Array(0)) }

const noteSequence = ref<NoteSequence>([])

resetNoteSequence()

function resetNoteSequence() {
  noteSequence.value = []
  noteSequence.value.push(new Note(0, 2, new Wave(
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
  noteSequence.value.push(new Note(1, 2, new Wave(
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
  console.time('generate')
  const playedSound = playSequence(noteSequence)
  console.timeEnd('generate')

  // if the same values, then we don't need to update the data
  if (visualizedData.ref.value.length === playedSound.audioData.length) {
    let same = true
    for (let i = 0; i < visualizedData.ref.value.length; i++) {
      if (visualizedData.ref.value[i] !== playedSound.audioData[i]) {
        same = false
        break
      }
    }
    if (same) {
      return
    }
  }

  visualizedData.ref.value = playedSound.audioData
}

</script>
