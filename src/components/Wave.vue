<template>
  <div>
    <div class="flex flex-col m-1">
      <label :for="'note' + wave.id">{{ namesOfPropsOfWave['type'] }}</label>
      <select
        v-model="wave.type"
        class="m-1"
        :id="'type' + wave.id"
      >
        <option
          v-for="waveType in Object.values(WaveType)"
          :key="waveType"
          :value="waveType"
        >
          {{ namesOfTypesOfWave[waveType] }}
        </option>
      </select>
    </div>
    <div
      v-for="prop in Object.keys(wave).filter(prop => typeof wave[prop] === 'number' && (wave.type !== WaveType.WHITE_NOISE || prop === 'amplitude') && (wave.type === WaveType.SQUARE || prop !== 'fullness'))"
      :key="prop"
      class="flex flex-col m-1"
    >
      <label :for="prop + wave.id">{{ namesOfPropsOfWave[prop] }}</label>
      <input
        :id="prop + wave.id"
        :value="wave[prop]"
        @input="wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
        type="number"
      >
    </div>
    <div class="flex justify-between m-1 mx-2 gap-x-2">
      <label :for="'amp-mod' + wave.id">{{ namesOfPropsOfWave['amplitudeMod'] }}</label>
      <input
        :id="'amp-mod' + wave.id"
        type="checkbox"
        v-model="amplitudeModIsOn"
      >
    </div>
    <WaveComponent v-if="amplitudeModIsOn" :wave="amplitudeMod!" class="border-2 rounded-lg m-1"/>
  </div>
</template>

<script setup lang="ts">

import { Wave, WaveType } from '../types/notes'
import WaveComponent from './Wave.vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  wave: Wave
}>()

const amplitudeMod = ref<Wave | undefined>(props.wave.amplitudeMod)
const amplitudeModIsOn = ref<boolean>(amplitudeMod.value !== undefined)

watch(amplitudeMod, (newVal) => {
  if (newVal) {
    props.wave.amplitudeMod = newVal
  } else {
    props.wave.amplitudeMod = undefined
  }
})

watch(amplitudeModIsOn, (newVal) => {
  if (newVal) {
    amplitudeMod.value = new Wave(WaveType.SINE, 0.5, 1, 0, 0.5)
  } else {
    amplitudeMod.value = undefined
  }
})

const namesOfPropsOfWave : {[key : string]: string} = {
  type: 'Wave Shape',
  amplitude: 'Amplitude',
  freq: 'Frequency',
  ph0: 'Start Phase',
  fullness: 'Fullness',
  center: 'Center',
  amplitudeMod: 'Amplitude Modulation',
}

const namesOfTypesOfWave : {[key : string]: string} = {
  [WaveType.SINE]: 'Sine',
  [WaveType.SQUARE]: 'Square',
  [WaveType.TRIANGLE]: 'Triangle',
  [WaveType.SAWTOOTH]: 'Sawtooth',
  [WaveType.WHITE_NOISE]: 'White Noise',
}

</script>