import numpy as np
import matplotlib.pyplot as plt

# Define the parameters
freq = 440
ph0 = 0
fullness = 0.5
pi = np.pi

# Define the time array
dPh = np.linspace(0, 3, 1000)

# Define the wave functions
def sine_wave(dPh, ph0):
    return np.sin((2 * dPh + ph0) * pi)

def square_wave(dPh, ph0, fullness):
    return np.sign(np.sin((2 * dPh - fullness + ph0 + 0.5) * pi) - np.cos(fullness * pi))

def sawtooth_wave(dPh, ph0):
    return 2 * (dPh + 0.5 * ph0 - np.floor(0.5 + dPh + 0.5 * ph0))

def triangle_wave(dPh, ph0):
    return np.abs(1 + 4 * dPh + 2 * ph0 - 4 * np.floor(0.75 + dPh + 0.5 * ph0)) - 1

# Calculate the waveforms
sine_waveform = sine_wave(dPh, ph0)
square_waveform = square_wave(dPh, ph0, fullness)
sawtooth_waveform = sawtooth_wave(dPh, ph0)
triangle_waveform = triangle_wave(dPh, ph0)

# Plot the waveforms
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.plot(dPh, sine_waveform)
plt.title('Sine Wave')

plt.subplot(2, 2, 2)
plt.plot(dPh, square_waveform)
plt.title('Square Wave')

plt.subplot(2, 2, 3)
plt.plot(dPh, sawtooth_waveform)
plt.title('Sawtooth Wave')

plt.subplot(2, 2, 4)
plt.plot(dPh, triangle_waveform)
plt.title('Triangle Wave')

plt.tight_layout()
plt.show()
