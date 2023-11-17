import * as math from "mathjs";

export function fourierTransform(inputArray: Float64Array): {
  amplitude: Float64Array;
  phase: Float64Array;
  realParts: Float64Array;
  imagParts: Float64Array;
} {
  const N = inputArray.length;
  const halfN = Math.floor(N / 2);
  const amplitude = new Float64Array(halfN);
  const phase = new Float64Array(halfN);
  const realParts = new Float64Array(halfN);
  const imagParts = new Float64Array(halfN);

  // Precompute cosine and sine values
  const cosValues = new Float64Array(N);
  const sinValues = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    cosValues[n] = Math.cos((-2 * Math.PI * n) / N);
    sinValues[n] = Math.sin((-2 * Math.PI * n) / N);
  }

  // Compute Fourier Transform
  for (let k = 0; k < halfN; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      real += inputArray[n] * cosValues[(k * n) % N];
      imag += inputArray[n] * sinValues[(k * n) % N];
    }
    amplitude[k] = math.sqrt(real * real + imag * imag) as number;
    phase[k] = math.atan2(imag, real);
    realParts[k] = real;
    imagParts[k] = imag;
  }

  return { amplitude, phase, realParts, imagParts };
}
