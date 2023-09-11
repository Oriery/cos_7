<template>
  <div
    class="border-2 rounded-lg m-1 flex flex-col justify-between"
  >
    <WaveComponent :wave="note.wave"/>
    <div class="mt-1 border-t-2 border-gray-700">
      <div>
        <div 
          v-for="prop in Object.keys(note).map(prop => prop.startsWith('_') ? prop.slice(1) : prop).filter((prop) => prop !== 'id' && prop !== 'endTime' && typeof note[prop] === 'number')"
          :key="prop"
          class="flex flex-col m-1 mx-2"
        >
          <label :for="prop + note.id" class="grow text-start">
            {{ propsOfNote[prop].name }}
              <span 
            v-if="propsOfNote[prop].unit"
            class="text-gray-400"
          >
            ({{ propsOfNote[prop].unit }})
          </span>
          </label>
          <v-text-field
            :value="note[prop]"
            @input="note[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
            hide-details
            single-line
            density="compact"
            type="number"
            :prepend-icon="propsOfNote[prop].icon"
          ></v-text-field>
        </div>
      </div>
      <div>
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
        <button
          @click="$emit('duplicate-note', note)"
          class="bg-blue-500 m-2 p-2"
        >
          Duplicate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import WaveComponent from './Wave.vue'
import { Note, playNote } from '../types/notes'

defineProps<{
  note: Note
}>()

defineEmits(['delete-note', 'duplicate-note'])

const propsOfNote : {[key : string]: {
  name: string,
  icon?: string,
  unit?: string,
}} = {
  startTime: {
    name: 'Start Time',
    icon: 'mdi-ray-start',
    unit: 's',
  },
  duration: {
    name: 'Duration',
    icon: 'mdi-timer',
    unit: 's',
  },
}

</script>