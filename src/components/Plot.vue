<template>
  <v-switch
    v-if="logorithmicScaleAllowed"
    label="Logorithmic scale"
    v-model="logorithmicScale"
    class="-mb-10"
  ></v-switch>
  <div ref="el"></div>
</template>

<script setup lang="ts">
import Plotly from "plotly.js-dist-min";
import { ref, onMounted, watch } from "vue";
import type { Ref } from "vue";

const props = defineProps<{
  data: { ref: Ref<Float64Array | number[]> };
  title?: string;
  logorithmicScaleAllowed?: boolean;
}>();

const el: Ref<HTMLDivElement> = ref(null as any);
const logorithmicScale = ref(false);

onMounted(drawData);

watch(props.data.ref, drawData);
watch(logorithmicScale, drawData);

function drawData() {
  Plotly.newPlot(
    el.value,
    [
      {
        y: props.data.ref.value,
        type: "scatter",
      },
    ],
    {
      title: props.title,
      yaxis: { type: logorithmicScale.value ? "log" : undefined },
    },
    { responsive: true }
  );
}
</script>
