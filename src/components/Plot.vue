<template>
  <div ref="el"></div>
</template>

<script setup lang="ts">
import Plotly from "plotly.js-dist-min";
import { ref, onMounted, watch } from "vue";
import type { Ref } from "vue";

const props = defineProps<{
  data: { ref: Ref<Float64Array> };
}>();

const el: Ref<HTMLDivElement> = ref(null as any);

onMounted(drawData);

watch(props.data.ref, drawData);

function drawData() {
  console.time("Drawing");
  Plotly.newPlot(el.value, [
    {
      y: props.data.ref.value,
      type: "scatter",
    },
  ], {}, {responsive: true});
  console.timeEnd("Drawing");
}

</script>
