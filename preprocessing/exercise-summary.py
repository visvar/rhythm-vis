from os import listdir


input_dir = "../data/raw"

dir_list = listdir(input_dir)

exercise_counts = {}

for f in dir_list:
    if f == ".gitkeep":
        continue
    print(f)
    # remove person, date, and take
    exercise = "_".join(f.split("_")[:-3])
    print(exercise)
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
