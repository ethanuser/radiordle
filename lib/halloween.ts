/**
 * Halloween decorations (a skull wordmark and a small hanging skeleton) show
 * only from October 15 to November 1, by the visitor's local date.
 */
export function isHalloweenSeason(date: Date): boolean {
  const month = date.getMonth(); // 0-based: 9 = October, 10 = November
  const day = date.getDate();
  return (month === 9 && day >= 15) || (month === 10 && day === 1);
}
