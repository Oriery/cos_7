import numpy as np
import matplotlib.pyplot as plt

# Define the parameters
freq = 440
ph0 = 0
fullness = 0.5
pi = np.pi

# Define the time array
t = np.linspace(0, 3/freq, 10000)  # 1 second interval with 10000 points

# Define the wave functions
def sine_wave(freq, t, ph0):
    return np.sin((2 * freq * t + ph0) * pi)

def square_wave(freq, t, ph0, fullness):
    return np.sign(np.sin((2 * freq * t - fullness + ph0 + 0.5) * pi) - np.cos(fullness * pi))

def sawtooth_wave(freq, t, ph0):
    return 2 * (t * freq + 0.5 * ph0 - np.floor(0.5 + t * freq + 0.5 * ph0))

def triangle_wave(freq, t, ph0):
    return np.abs(2 * (0.25 + t * freq + 0.5 * ph0 - np.floor(0.75 + t * freq + 0.5 * ph0))) - 1

# Calculate the waveforms
sine_waveform = sine_wave(freq, t, ph0)
square_waveform = square_wave(freq, t, ph0, fullness)
sawtooth_waveform = sawtooth_wave(freq, t, ph0)
triangle_waveform = triangle_wave(freq, t, ph0)

# Plot the waveforms
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.plot(t, sine_waveform)
plt.title('Sine Wave')

plt.subplot(2, 2, 2)
plt.plot(t, square_waveform)
plt.title('Square Wave')

plt.subplot(2, 2, 3)
plt.plot(t, sawtooth_waveform)
plt.title('Sawtooth Wave')

plt.subplot(2, 2, 4)
plt.plot(t, triangle_waveform)
plt.title('Triangle Wave')

plt.tight_layout()
plt.show()
