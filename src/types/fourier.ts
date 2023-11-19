import * as math from "mathjs";

export type FourierResult = {
  amplitude: Float64Array;
  phase: Float64Array;
  realParts: Float64Array;
  imagParts: Float64Array;
};

export function fourierTransform(inputArray: Float64Array): FourierResult {
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

export function fastFourierTransform(inputArray: Float64Array): FourierResult {
  let N = inputArray.length;
  if ((N & (N - 1)) !== 0) {
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(N)));
    const paddedInput = new Float64Array(nextPow2);
    paddedInput.set(inputArray);
    inputArray = paddedInput;
    N = nextPow2;
  }

  const halfN = Math.floor(N / 2);
  const amplitude = new Float64Array(halfN);
  const phase = new Float64Array(halfN);
  const realParts = new Float64Array(halfN);
  const imagParts = new Float64Array(halfN);

  // Recursive FFT function
  function fft(input: math.Complex[]) {
    const n = input.length;

    // Base case
    if (n === 1) return [input[0]];

    // Split the input into even and odd parts
    const even = fft(input.filter((_, i) => i % 2 === 0));
    const odd = fft(input.filter((_, i) => i % 2 !== 0));

    // Combine
    const combined = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      const e = even[k]
      const o = odd[k]
      const oMult = math.multiply(o, math.exp(math.complex(0, -2 * Math.PI * k / n)));
      combined[k] = math.add(e, oMult);
      combined[k + n / 2] = math.subtract(e, oMult);
    }

    return combined;
  }

  // Perform FFT and extract real and imaginary parts
  let fftResult = fft(inputArray.reduce((acc, val) => {
    acc.push(math.complex(val, 0));
    return acc;
  }, [] as math.Complex[]));

  // Normalize
  const scale = 1 / N;
  fftResult = fftResult.map((val) => math.multiply(val, scale));

  for (let k = 0; k < halfN; k++) {
    const real = fftResult[k].re;
    const imag = fftResult[k].im;

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
  const halfN = realParts.length;
  const N = halfN * 2;
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
    for (let k = 0; k < halfN; k++) {
      real += realParts[k] * cosValues[(k * n) % N];
      imag += imagParts[k] * sinValues[(k * n) % N];
    }

    outputArray[n] = 2 * (real + imag);
  }

  return outputArray.reverse();
}

export function bandpassFilter(
  fourier: FourierResult,
  sampleRate: number,
  minFreq: number,
  maxFreq: number,
  allow: boolean = true
) : FourierResult {
  const N = fourier.amplitude.length;
  const outputAmplitude = new Float64Array(N);
  const outputPhase = new Float64Array(N);
  const outputRealParts = new Float64Array(N);
  const outputImagParts = new Float64Array(N);

  const minFreqIndex = Math.round((minFreq * N * 2) / sampleRate);
  const maxFreqIndex = Math.round((maxFreq * N * 2) / sampleRate);

  if (allow) {
    for (let i = 0; i < N; i++) {
      if (i >= minFreqIndex && i <= maxFreqIndex) {
        outputAmplitude[i] = fourier.amplitude[i];
        outputPhase[i] = fourier.phase[i];
        outputRealParts[i] = fourier.realParts[i];
        outputImagParts[i] = fourier.imagParts[i];
      } else {
        outputAmplitude[i] = 0;
        outputPhase[i] = 0;
        outputRealParts[i] = 0;
        outputImagParts[i] = 0;
      }
    }
  } else {
    throw new Error("Not implemented");
  }

  return { amplitude: outputAmplitude, phase: outputPhase, realParts: outputRealParts, imagParts: outputImagParts };
}