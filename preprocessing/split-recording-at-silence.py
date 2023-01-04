# TODO: use json file directly, if MIDI file, then first parse it to JSON?

# split along metronome clicks/accents


import auditok
import pathlib
import json
import pretty_midi
import matplotlib.pyplot as plt

file = ""
file_without_ext = pathlib.Path(file).stem

file_wav = f"{file}.wav"
file_midi = f"{file}.mid"

# TODO: get start index by looking for files with same name
# and taking the one with highest index
start_index = 0


# get regions of non-silence
# 3 cases, either audio, or MIDI, or both (or mutliple MIDI?)

# if multiple, merge regions
# expand regions to metronome click


def merge_regions():
    pass


def get_metronome_clicks(file_metro):
    with open(file_metro) as f:
        clicks = json.load(f)
        return clicks


def expand_regions_to_clicks(regions, clicks):
    pass


def get_midi_json_regions(
        file_midi_json,
        min_region_dur=5,
        max_silence_dur=2,
        min__note_velocity=32):
    """
    Extracts regions of non-silence from MIDI stored as JSON
    Looks only at note starts.
    Result format: [[start, end], ...]
    """
    regions = []
    current_region_start = 0
    current_region_tmp_end = 0

    with open(file_midi_json) as f:
        notes = json.load(f)
        # TODO: sort notes by time

        for note in notes:
            if current_region_start == 0:
                # first region starts with first note
                current_region_start = note.start
            last_region_end = regions[-1][1]
            if note.start > last_region_end + max_silence_dur:
                # new region
                regions.append([
                    current_region_start,
                    current_region_tmp_end])
                current_region_start = note.start
            current_region_tmp_end = note.start

    # last region ends with last note
    regions[-1][1] = notes[-1].start
    return regions


def get_audio_regions(file_wav):
    """
    Extracts regions of non-silence from audio.
    Result format: [[start, end], ...]
    """
    regions = []
    audio_regions = auditok.split(
        file_wav,
        min_dur=5,  # minimum duration of a valid audio event in seconds
        max_dur=1200,  # maximum duration of an event
        max_silence=2,  # maximum duration of tolerated continuous silence within an event
        energy_threshold=55  # threshold of detection
    )
    for r in audio_regions:
        regions.append([r.meta.start, r.meta.end])
    return regions
