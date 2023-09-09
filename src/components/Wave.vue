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
      v-for="prop in Object.keys(wave).filter(prop => typeof wave[prop] === 'number' && (wave.type !== WaveType.WHITE_NOISE || prop === 'amplitude') && (wave.type === WaveType.SQUARE || prop !== 'fullness') && (prop !== 'freq' || !freqModIsOn))"
      :key="prop"
      class="flex flex-col m-1 mx-2"
    >
      <label :for="prop + wave.id" class="grow text-start">{{ namesOfPropsOfWave[prop] }}</label>
      <input
        :id="prop + wave.id"
        :value="wave[prop]"
        @input="wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
        type="number"
        class="px-2"
      >
    </div>
    <div :class="freqMod && amplitudeMod ? 'flex flex-row' : ''">
      <div>
        <div class="flex justify-between m-1 mx-2 gap-x-2">
          <label :for="'amp-mod' + wave.id" class="grow text-start">{{ namesOfPropsOfWave['amplitudeMod'] }}</label>
          <input
            :id="'amp-mod' + wave.id"
            type="checkbox"
            v-model="amplitudeModIsOn"
            class="px-2"
          >
        </div>
        <WaveComponent v-if="amplitudeModIsOn" :wave="amplitudeMod!" class="border-2 rounded-lg m-1"/>
      </div>
      <div>
        <div class="flex justify-between m-1 mx-2 gap-x-2">
          <label :for="'freq-mod' + wave.id" class="grow text-start">{{ namesOfPropsOfWave['freqMod'] }}</label>
          <input
            :id="'freq-mod' + wave.id"
            type="checkbox"
            v-model="freqModIsOn"
            class="px-2"
          >
        </div>
        <WaveComponent v-if="freqModIsOn" :wave="freqMod!" class="border-2 rounded-lg m-1"/>
      </div>
    </div>
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
const freqMod = ref<Wave | undefined>(props.wave.freqMod)
const freqModIsOn = ref<boolean>(freqMod.value !== undefined)

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

watch(freqMod, (newVal) => {
  if (newVal) {
    props.wave.freqMod = newVal
  } else {
    props.wave.freqMod = undefined
  }
})

watch(freqModIsOn, (newVal) => {
  if (newVal) {
    freqMod.value = new Wave(WaveType.SINE, 220, 1, 0, 440)
  } else {
    freqMod.value = undefined
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
  freqMod: 'Frequency Modulation',
}

const namesOfTypesOfWave : {[key : string]: string} = {
  [WaveType.SINE]: 'Sine',
  [WaveType.SQUARE]: 'Square',
  [WaveType.TRIANGLE]: 'Triangle',
  [WaveType.SAWTOOTH]: 'Sawtooth',
  [WaveType.WHITE_NOISE]: 'White Noise',
}

</script>