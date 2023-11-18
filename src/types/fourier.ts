import * as math from "mathjs";

export type FourierResult = {
  amplitude: Float64Array;
  phase: Float64Array;
  realParts: Float64Array;
  imagParts: Float64Array;
}

export function fourierTransform(inputArray: Float64Array): FourierResult {
  const N = inputArray.length;
  const amplitude = new Float64Array(N);
  const phase = new Float64Array(N);
  const realParts = new Float64Array(N);
  const imagParts = new Float64Array(N);

  // Precompute cosine and sine values
  const cosValues = new Float64Array(N);
  const sinValues = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    cosValues[n] = Math.cos((-2 * Math.PI * n) / N);
    sinValues[n] = Math.sin((-2 * Math.PI * n) / N);
  }

  // Compute Fourier Transform
  for (let k = 0; k < N; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      real += inputArray[n] * cosValues[(k * n) % N];
      imag += inputArray[n] * sinValues[(k * n) % N];
    }

    // Normalize
    real /= N;
    imag /= N;

    amplitude[k] = Math.sqrt(real * real + imag * imag);
    phase[k] = math.atan2(imag, real);
    realParts[k] = real;
    imagParts[k] = imag;
  }

  return { amplitude, phase, realParts, imagParts };
}

export function inverseFourierTransform(
  realParts: Float64Array,
  imagParts: Float64Array
): Float64Array {
  const N = realParts.length;
  const outputArray = new Float64Array(N);

  // Precompute cosine and sine values
  const cosValues = new Float64Array(N);
  const sinValues = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    cosValues[n] = Math.cos((2 * Math.PI * n) / N);
    sinValues[n] = Math.sin((2 * Math.PI * n) / N);
  }

  // Compute Inverse Fourier Transform
  for (let n = 0; n < N; n++) {
    let real = 0;
    let imag = 0;
    for (let k = 0; k < N; k++) {
      real += realParts[k] * cosValues[(k * n) % N];
      imag += imagParts[k] * sinValues[(k * n) % N];
    }

    outputArray[n] = real + imag;
  }

  return outputArray.reverse();
}
