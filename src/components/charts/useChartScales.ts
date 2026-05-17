export function linearScale(
  domainMax: number,
  rangeMax: number,
): (value: number) => number {
  if (domainMax <= 0) return () => 0
  return (value: number) => (value / domainMax) * rangeMax
}

export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const step = niceStep(max / count)
  const ticks: number[] = []
  for (let v = 0; v <= max + step / 2; v += step) {
    ticks.push(v)
  }
  return ticks
}

function niceStep(raw: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / exp
  let nice: number
  if (f < 1.5) nice = 1
  else if (f < 3) nice = 2
  else if (f < 7) nice = 5
  else nice = 10
  return nice * exp
}
