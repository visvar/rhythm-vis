"""
# Preprocessing

- Convert .webm to .wav
- Trim silence
- Normalize
- Extract MIDI with basic-pitch
- Save MIDI as JSON

## Setup

Create virtual env: `<python executable path> -m venv venv`
Activate it: `.\venv\Scripts\activate`

## Requirements

- ffmpeg
- pip intall basic-pitch librosa
"""

import tensorflow as tf
import librosa
import soundfile as sf
import subprocess
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
from pretty_midi import note_number_to_name
import json

def convert_webm_to_wav(file):
    """
    Converts webm to wav using ffmpeg
    """
    command = ['ffmpeg', '-i', file, '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000', file[:-5] + '.wav']
    subprocess.run(command,stdout=subprocess.PIPE,stdin=subprocess.PIPE)

def trim_silence_and_normalize(file):
    """
    Trims beginning and ending silence
    """
    y, sr = librosa.load(file)
    yt, index = librosa.effects.trim(y)
    # print(librosa.get_duration(y), librosa.get_duration(yt))
    yt = librosa.util.normalize(yt)
    # Write out audio as 24bit PCM WAV
    sf.write(file, yt, sr, subtype='PCM_24')

def write_midi_json(midi_data, json_file_name):
    """
    Takes a pretty_midi object, converts it to musicvis-lib format, and writes
    the result to a .json file
    """
    notes = []
    for instrument in midi_data.instruments:
        for note in instrument.notes:
            notes.append({
                "start": float(note.start),
                "end": float(note.end),
                "pitch": int(note.pitch),
                "velocity": int(note.velocity),
                "duration": note.get_duration(),
                "name": note_number_to_name(note.pitch)
            })
    json_object = {
        "notes": notes,
        # "filename": file
        # name
        # date
    }
    json_string = json.dumps(json_object)
    # write JSON to file
    with open(json_file_name, "w") as json_file:
        json_file.write(json_string + "\n")

# load basic_pitch model
basic_pitch_model = tf.saved_model.load(str(ICASSP_2022_MODEL_PATH))

file_webm = "../data/test/blues-60x2-1_2022-11-15T23-04-17.661Z.webm"
file_without_ext = file_webm[:-5]
file_wav = file_without_ext + ".wav"

# convert to wav, creates a new file at same directory with .wav extension
# TODO: check if exists
convert_webm_to_wav(file_webm)

# trim silence and normalize
trim_silence_and_normalize(file_wav)

# run basic-pitch
model_output, midi_data, note_activations = predict(
    file_wav,
    basic_pitch_model,
)

# save MIDI file
midi_data.write(file_without_ext + ".midi")

# convert notes to same format as used in musicvis-lib
write_midi_json(midi_data, file_without_ext + ".json")
