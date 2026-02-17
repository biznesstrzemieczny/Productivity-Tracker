// Jedno źródło prawdy dla score/efficiency w całej aplikacji.
// Założenie: 10/10 jest możliwe tylko gdy:
// - energy = 10
// - focus = 10
// - mood = 10
// - result = 10
// - stressLevel = 1
export const calculateEfficiency = (entry) => {
  if (!entry) return 0;

  const clamp01 = (n) => Math.max(0, Math.min(1, Number(n)));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));

  const energyN = clamp01((entry.energy ?? 0) / 10);
  const focusN = clamp01((entry.focus ?? 0) / 10);
  const moodN = clamp01((entry.mood ?? 0) / 10);
  const resultN = clamp01(((entry.result ?? 5) || 0) / 10);

  // Bazowy wynik to średnia z 4 składowych (0..1).
  // To sprawia, że brak/niski result ogranicza maksymalny score.
  const base = (energyN + focusN + moodN + resultN) / 4;

  // Stress działa multiplikatywnie: stress=1 => 1.0, stress=10 => 0.65
  // Dzięki temu 10/10 nie wystąpi przy wyższym stresie, nawet gdy reszta jest wysoka.
  const stressLevel = clamp(entry.stressLevel ?? 5, 1, 10);
  const stressN = (stressLevel - 1) / 9; // 0..1
  const stressFactor = 1 - stressN * 0.35;

  const score = 10 * base * stressFactor;
  return clamp(score, 0, 10);
};

