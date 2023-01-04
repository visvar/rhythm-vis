import auditok
import pathlib


# file_wav = "../data/prep/blues-60x2-1_2022-11-15T23-04-17.661Z.wav"
file_wav = "../data/raw/blues-60x2-1_2022-11-15T23-04-17.661Z.webm"
file_without_ext = pathlib.Path(file_wav).stem

# TODO: get start index by looking for files with same name
# and taking the one with highest index
start_index = 0


audio_regions = auditok.split(
    file_wav,
    min_dur=5,  # minimum duration of a valid audio event in seconds
    max_dur=120,  # maximum duration of an event
    max_silence=2,  # maximum duration of tolerated continuous silence within an event
    energy_threshold=55  # threshold of detection
)
for i, r in enumerate(audio_regions):
    print(
        "Region {i}: {r.meta.start:.3f}s -- {r.meta.end:.3f}s".format(i=i, r=r))
    filename = r.save(f"{file_without_ext}_{i+start_index}.wav")
    print(filename)
