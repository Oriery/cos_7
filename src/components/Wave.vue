<template>
  <div
    :class="dedicatedDesign ? 'border-2 rounded-lg m-1' : ''"
  >
    <select
      v-model="wave.type"
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
      v-for="prop in Object.keys(wave).filter(prop => typeof wave[prop] === 'number' && (wave.type !== WaveType.WHITE_NOISE || prop === 'amplitude') && (wave.type === WaveType.SQUARE || prop !== 'fullness'))"
      :key="prop"
      class="flex flex-col m-1"
    >
      <label :for="prop">{{ prop }}</label>
      <input
        :name="prop"
        :value="wave[prop]"
        @input="wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
        type="number"
      >
    </div>
  </div>
</template>

<script setup lang="ts">

import { Wave, WaveType } from '../types/notes'

defineProps<{
  wave: Wave
  dedicatedDesign?: boolean
}>()

</script>