<template>
  <div>
    <div class="flex flex-col m-1 min-w-[15rem]">
      <p class="text-start mx-1">{{ propsOfWave['type'].name }}</p>
      <v-btn-toggle v-model="wave.type">
        <v-btn value='sine'>
          <v-icon>mdi-sine-wave</v-icon>
        </v-btn>
        <v-btn value="square">
          <v-icon>mdi-square-wave</v-icon>
        </v-btn>
        <v-btn value="triangle">
          <v-icon>mdi-triangle-wave</v-icon>
        </v-btn>
        <v-btn value="sawtooth">
          <v-icon>mdi-sawtooth-wave</v-icon>
        </v-btn>
        <v-btn value="white-noise">
          <v-icon>mdi-waveform</v-icon>
        </v-btn>
      </v-btn-toggle>
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
        :prepend-icon="propsOfWave[prop].icon"
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
        :prepend-icon="propsOfWave[prop].icon"
      ></v-text-field>
    </div>
    <div :class="'mt-2 ' + (freqMod && amplitudeMod ? 'flex flex-row' : '')">
      <div>
        <v-switch
          v-model="amplitudeModIsOn"
          hide-details
          :label="propsOfWave['amplitudeMod'].name"
          class="mx-2 my-n4"
        ></v-switch>
        <WaveComponent v-if="amplitudeModIsOn" :wave="amplitudeMod!" class="border-2 rounded-lg m-1"/>
      </div>
      <div>
        <v-switch
          v-model="freqModIsOn"
          hide-details
          :label="propsOfWave['freqMod'].name"
          class="mx-2 my-n4"
        ></v-switch>
        <WaveComponent v-if="freqModIsOn" :wave="freqMod!" class="border-2 rounded-lg m-1"/>
      </div>
      <div v-if="!freqModIsOn" class="h-2"></div>
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
  icon?: string
}} = {
  type: {
    name: 'Wave Shape',
    type: 'select',
    options: Object.values(WaveType),
  },
  amplitude: {
    name: 'Amplitude',
    type: 'number',
    icon: 'mdi-volume-high'
  },
  freq: {
    name: 'Frequency',
    type: 'number',
    unit: 'Hz',
    icon: 'mdi-sine-wave',
  },
  ph0: {
    name: 'Start Phase',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.5,
    unit: 'π * rad',
    icon: 'mdi-radius-outline'
  },
  fullness: {
    name: 'Fullness',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
    icon: 'mdi-square-wave',
  },
  center: {
    name: 'Center',
    type: 'number',
    icon: 'mdi-waves-arrow-up'
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