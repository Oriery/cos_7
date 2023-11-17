<template>
  <div ref="el"></div>
</template>

<script setup lang="ts">
import Plotly from "plotly.js-dist-min";
import { ref, onMounted } from "vue";
import type { Ref } from "vue";

const props = defineProps<{
  data: Float64Array,
}>()

const el: Ref<HTMLDivElement> = ref(null as any);

onMounted(() => {
  console.log('Drawing');
  Plotly.newPlot(el.value, [
    {
      y: props.data,
      type: "scatter",
    },
  ]);
});

</script>
