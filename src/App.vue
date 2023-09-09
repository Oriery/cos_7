<template>
  <div>
    <h2 class="text-xl">Sound Maker</h2>
    <div>
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
      <button 
        @click="createNote"
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
        @click="() => playSequence(noteSequence as NoteSequence)"
        class="bg-green-500 m-2 p-2"
      >
        Play Sequence
      </button>
      <button 
        @click="resetNoteSequence"
        class="bg-blue-500 m-2 p-2"
      >
        Reset To Default
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import NoteComponent from './components/Note.vue'
import { Note, Wave, WaveType, playSequence, NoteSequence } from './types/notes'

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

</script>
