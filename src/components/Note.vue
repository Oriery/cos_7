<template>
  <div
    class="border-2 rounded-lg m-1"
  >
    <WaveComponent :wave="note.wave"/>
    <br>
    <div 
      v-for="prop in Object.keys(note).map(prop => prop.startsWith('_') ? prop.slice(1) : prop).filter((prop) => prop !== 'id' && prop !== 'endTime' && typeof note[prop] === 'number')"
      :key="prop"
      class="flex flex-col m-1"
    >
      <label :for="prop">{{ prop }}</label>
      <input
        :name="prop"
        :value="note[prop]"
        @input="note[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
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
      @click="$emit('delete-note', note)"
      class="bg-red-500 m-2 p-2"
    >
      Delete
    </button>
  </div>
</template>

<script setup lang="ts">

import WaveComponent from './Wave.vue'
import { Note, playNote } from '../types/notes'

defineProps<{
  note: Note
}>()

defineEmits(['delete-note'])

</script>