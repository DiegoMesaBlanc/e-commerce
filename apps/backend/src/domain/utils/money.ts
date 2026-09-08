export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function percentageFromRatio(ratio: number): number {
  return Math.round(ratio * 10000) / 100;
}