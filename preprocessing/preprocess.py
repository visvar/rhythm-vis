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
- pip install basic-pitch librosa
"""

from termcolor import colored, cprint
import json
from pretty_midi import note_number_to_name
from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import predict
import soundfile as sf
import librosa
import subprocess
from os import listdir
from os.path import exists, basename
import pathlib
import tensorflow as tf

# Config
input_dir = "../data/raw"
output_dir = "../data/prep"


# Colored info
def info(x): return cprint(x, "white", "on_green")


def convert_to_wav(infile, outfile):
    """
    Converts webm to wav using ffmpeg
    """
    command = ['ffmpeg', '-i', infile, '-acodec', 'pcm_s16le', '-ac',
               '1', '-ar', '16000', outfile, '-hide_banner', '-loglevel', 'error']
    subprocess.run(command, stdout=subprocess.PIPE, stdin=subprocess.PIPE)


def trim_silence_and_normalize(file):
    """
    Trims beginning and ending silence
    """
    y, sr = librosa.load(file)
    yt, index = librosa.effects.trim(y)
    # print(librosa.get_duration(y), librosa.get_duration(yt))
    yt = librosa.util.normalize(yt)
    # Write out audio as 24bit PCM WAV
    # sf.write(file, yt, sr, subtype='PCM_24')
    sf.write(file, yt, sr, subtype='PCM_16')


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
                "name": note_number_to_name(note.pitch),
                "port": "basic-pitch",
                "channel": 0
            })
    json_object = {
        "notes": notes
    }
    json_string = json.dumps(json_object)
    # write JSON to file
    with open(json_file_name, "w") as json_file:
        json_file.write(json_string + "\n")


def main():
    """
    Main function
    """
    # load basic_pitch model
    basic_pitch_model = tf.saved_model.load(str(ICASSP_2022_MODEL_PATH))
    # read files from raw/ directory and process them
    dir_list = listdir(input_dir)
    for file_raw in dir_list:
        if file_raw == ".gitkeep":
            continue
        file_name = basename(file_raw)
        file_without_ext = pathlib.Path(file_name).stem
        file_out_base = f"{output_dir}/{file_without_ext}"
        file_wav = f"{file_out_base}.wav"
        if exists(file_wav):
            info("\nSkipping file, already processed: " + file_wav)
        else:
            info("\nProcessing " + file_without_ext)
            # convert to wav, creates a new file at same directory with .wav extension
            convert_to_wav(f"{input_dir}/{file_raw}", file_wav)
            # trim silence and normalize
            trim_silence_and_normalize(file_wav)
            # run basic-pitch
            model_output, midi_data, note_activations = predict(
                file_wav,
                basic_pitch_model,
            )
            # save MIDI file
            midi_data.write(f"{file_out_base}.bp.midi")
            # convert notes to same format as used in musicvis-lib
            write_midi_json(midi_data, f"{file_out_base}.bp.json")


main()
