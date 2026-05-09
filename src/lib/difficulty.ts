/** Session question difficulty 1–25 → bucket label for UI badges */
export function difficultyBand(n: number): string {
  if (n <= 5) return 'Very Easy';
  if (n <= 10) return 'Easy';
  if (n <= 15) return 'Medium';
  if (n <= 20) return 'Hard';
  return 'Insane Beginner';
}

export function difficultyTone(n: number): 'emerald' | 'cyan' | 'amber' | 'orange' | 'fuchsia' {
  if (n <= 5) return 'emerald';
  if (n <= 10) return 'cyan';
  if (n <= 15) return 'amber';
  if (n <= 20) return 'orange';
  return 'fuchsia';
}
