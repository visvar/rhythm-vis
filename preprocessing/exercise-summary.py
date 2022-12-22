from os import listdir
import pathlib

exerc_dir = "../data/exercises"
prep_dir = "../data/raw"


unique_names = set({})
exerc_list = listdir(exerc_dir)
for f in exerc_list:
    if f == ".gitkeep":
        continue
    file_without_ext = pathlib.Path(f).stem
    unique_names.add(file_without_ext)

for f in sorted(list(unique_names)):
    print(f)


prep_list = listdir(prep_dir)
exercise_counts = {}

for f in prep_list:
    if f == ".gitkeep":
        continue
    # remove person, date, and take
    exercise = "_".join(f.split("_")[:-3])
    if not exercise in exercise_counts:
        exercise_counts[exercise] = 1
    else:
        exercise_counts[exercise] += 1

print("Exercises")
print(sorted(exercise_counts.keys()))

print("\nCounts")
exercise_counts = {key: val for key, val in sorted(
    exercise_counts.items(), key=lambda ele: ele[0], reverse=False)}
for k, v in exercise_counts.items():
    print(f"{k:<50}", v)

print("\nCounts (sorted)")
sorted_counts = {key: val for key, val in sorted(
    exercise_counts.items(), key=lambda ele: ele[1], reverse=True)}
for k, v in sorted_counts.items():
    print(f"{k:<50}", v)
