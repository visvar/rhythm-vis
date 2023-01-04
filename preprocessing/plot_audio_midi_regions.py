# -*- coding: utf-8 -*-
"""
Adapted from https://librosa.org/doc/latest/auto_examples/plot_viterbi.html#sphx-glr-auto-examples-plot-viterbi-py
"""

# Code source: Brian McFee
# License: ISC

import numpy as np
import matplotlib.pyplot as plt
import librosa
import librosa.display

y, sr = librosa.load(librosa.ex('trumpet'))
S_full, phase = librosa.magphase(librosa.stft(y))

fig, ax = plt.subplots()
img = librosa.display.specshow(librosa.amplitude_to_db(S_full, ref=np.max),
                               y_axis='log', x_axis='time', sr=sr, ax=ax)
fig.colorbar(img, ax=ax)
rms = librosa.feature.rms(y=y)[0]
times = librosa.frames_to_time(np.arange(len(rms)))

fig, ax = plt.subplots()
ax.plot(times, rms)
ax.axhline(0.02, color='r', alpha=0.5)
ax.set(xlabel='Time', ylabel='RMS')

r_normalized = (rms - 0.02) / np.std(rms)
p = np.exp(r_normalized) / (1 + np.exp(r_normalized))

fig, ax = plt.subplots()
ax.plot(times, p, label='P[V=1|x]')
ax.axhline(0.5, color='r', alpha=0.5, label='Descision threshold')
ax.set(xlabel='Time')
ax.legend()

plt.figure(figsize=(12, 6))
fig, ax = plt.subplots(nrows=2, sharex=True)
librosa.display.specshow(librosa.amplitude_to_db(S_full, ref=np.max),
                         y_axis='log', x_axis='time', sr=sr, ax=ax[0])
ax[0].label_outer()
ax[1].step(times, p >= 0.5, label='Non-silent')
ax[1].set(ylim=[0, 1.05])
ax[1].legend()

transition = librosa.sequence.transition_loop(2, [0.5, 0.6])
print(transition)

full_p = np.vstack([1 - p, p])
print(full_p)

states = librosa.sequence.viterbi_discriminative(full_p, transition)

fig, ax = plt.subplots(nrows=2, sharex=True)
librosa.display.specshow(librosa.amplitude_to_db(S_full, ref=np.max),
                         y_axis='log', x_axis='time', sr=sr, ax=ax[0])
ax[0].label_outer()
ax[1].step(times, p >= 0.5, label='Frame-wise')
ax[1].step(times, states, linestyle='--', color='orange', label='Viterbi')
ax[1].set(ylim=[0, 1.05])
ax[1].legend()
