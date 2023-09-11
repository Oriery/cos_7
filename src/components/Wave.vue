<template>
  <div>
    <div class="flex flex-col m-1 min-w-[15rem]">
      <label :for="'note' + wave.id">{{ propsOfWave['type'].name }}</label>
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
      <label :for="prop + wave.id" class="grow text-start">
        {{ propsOfWave[prop].name }} 
        <span 
          v-if="propsOfWave[prop].unit"
          class="text-gray-400"
        >
          {{ propsOfWave[prop].unit }}
        </span>
      </label>
      <v-slider
        v-if="propsOfWave[prop].min !== undefined && propsOfWave[prop].max !== undefined"
        v-model="wave[prop]"
        class="align-center mr-0"
        :max="propsOfWave[prop].max"
        :min="propsOfWave[prop].min"
        :step="propsOfWave[prop].step"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            :value="wave[prop]"
            @input="wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
            hide-details
            single-line
            density="compact"
            type="number"
            style="width: 6rem;"
          ></v-text-field>
        </template>
      </v-slider>
      <v-text-field
        v-else
        :value="wave[prop]"
        @input="wave[prop] = Number(($event?.target as HTMLInputElement)?.value || 0)"
        hide-details
        single-line
        density="compact"
        type="number"

      ></v-text-field>
    </div>
    <div :class="freqMod && amplitudeMod ? 'flex flex-row' : ''">
      <div>
        <div class="flex justify-between m-1 mx-2 gap-x-2">
          <label :for="'amp-mod' + wave.id" class="grow text-start">{{ propsOfWave['amplitudeMod'].name }}</label>
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
          <label :for="'freq-mod' + wave.id" class="grow text-start">{{ propsOfWave['freqMod'].name }}</label>
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

const propsOfWave : {[key : string]: {
  name: string
  type: 'number' | 'boolean' | 'select'
  options?: string[]
  min?: number
  max?: number
  step?: number
  unit?: string
}} = {
  type: {
    name: 'Wave Shape',
    type: 'select',
    options: Object.values(WaveType),
  },
  amplitude: {
    name: 'Amplitude',
    type: 'number',
  },
  freq: {
    name: 'Frequency',
    type: 'number',
    unit: 'Hz',
  },
  ph0: {
    name: 'Start Phase',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.5,
    unit: 'π * rad',
  },
  fullness: {
    name: 'Fullness',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  center: {
    name: 'Center',
    type: 'number',
  },
  amplitudeMod: {
    name: 'Amplitude Modulation',
    type: 'boolean',
  },
  freqMod: {
    name: 'Frequency Modulation',
    type: 'boolean',
  },
}

const namesOfTypesOfWave : {[key : string]: string} = {
  [WaveType.SINE]: 'Sine',
  [WaveType.SQUARE]: 'Square',
  [WaveType.TRIANGLE]: 'Triangle',
  [WaveType.SAWTOOTH]: 'Sawtooth',
  [WaveType.WHITE_NOISE]: 'White Noise',
}

</script>