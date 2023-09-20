Plot.plot({
  width,
  height: 100,
  marginLeft: 50,
  x: {
    axis: showAxis,
    label: "time in seconds",
    domain: [0, d3.max(pattern) + 1]
  },
  marks: [
    Plot.tickX(pattern, { x: (d) => d })
    // Plot.ruleX([currentTime])
  ]
})
