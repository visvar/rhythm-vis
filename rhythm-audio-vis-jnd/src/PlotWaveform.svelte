  return Plot.plot({
    width,
    height: 120,
    marginLeft: 50,
    x: { axis: showAxis, label: "time in seconds" },
    y: { axis: false },
    marks: [
      Plot.lineY(channelData, { x: (d, i) => i / sampleRate, y: (d) => d })
    ]
  });
