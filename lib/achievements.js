export const GLOBAL_ACHIEVEMENTS = [
  {
    id: 'global_first',
    name: 'Primera partida',
    desc: 'Jugar 1 ronda completa',
    icon: '🎮',
    xp: 5,
    check: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'global_duo',
    name: 'Duo Power',
    desc: 'Primera partida con otra persona',
    icon: '🤝',
    xp: 10,
    check: (stats) => stats.totalSessions >= 1, // siempre es 2 jugadores
  },
  {
    id: 'global_explorer',
    name: 'Explorador geek',
    desc: 'Jugar 5 universos distintos',
    icon: '🧭',
    xp: 30,
    check: (stats) => (stats.universesPlayed?.length || 0) >= 5,
  },
  {
    id: 'global_multiverse',
    name: 'Multiverso',
    desc: 'Jugar todos los universos disponibles',
    icon: '🌌',
    xp: 100,
    check: (stats, availableCount) => (stats.universesPlayed?.length || 0) >= availableCount,
  },
  {
    id: 'global_centurion',
    name: 'Centurión',
    desc: '100 respuestas correctas en total',
    icon: '🏅',
    xp: 50,
    check: (stats) => (stats.totalCorrect || 0) >= 100,
  },
  {
    id: 'global_streak',
    name: 'Racha épica',
    desc: '10 correctas seguidas en cualquier universo',
    icon: '🔥',
    xp: 40,
    check: (stats) => (stats.maxStreak || 0) >= 10,
  },
  {
    id: 'global_perfect',
    name: 'Perfeccionista',
    desc: '5 rondas perfectas en cualquier universo',
    icon: '✨',
    xp: 80,
    check: (stats) => (stats.totalPerfectRounds || 0) >= 5,
  },
  {
    id: 'global_legend',
    name: 'Leyenda del café',
    desc: '1000 respuestas correctas en total',
    icon: '☠️',
    xp: 200,
    check: (stats) => (stats.totalCorrect || 0) >= 1000,
  },
]

// Per-universe achievements follow the structure defined in universes.js
// Each universe has: speed1/2/3, acc1/2/3/4, duel1/2/3/4

export function checkUniverseAchievements(universe, progress, sessionResult) {
  const unlocked = []

  // Speed achievements (based on session fastest_ms)
  if (sessionResult.fastestMs <= 5000) unlocked.push(`${universe.id}_speed1`)
  if (sessionResult.fastestStreak3 <= 5000) unlocked.push(`${universe.id}_speed2`)
  if (sessionResult.fastestStreak5 <= 3000) unlocked.push(`${universe.id}_speed3`)

  // Accuracy achievements
  if (progress.correct_total >= 1) unlocked.push(`${universe.id}_acc1`)
  if (sessionResult.roundScore >= 7) unlocked.push(`${universe.id}_acc2`)
  if (sessionResult.roundScore >= 10) unlocked.push(`${universe.id}_acc3`)
  if (progress.perfect_rounds >= 3) unlocked.push(`${universe.id}_acc4`)

  // Duel achievements
  if (progress.duel_wins >= 1)  unlocked.push(`${universe.id}_duel1`)
  if (progress.duel_wins >= 5)  unlocked.push(`${universe.id}_duel2`)
  if (progress.duel_wins >= 10) unlocked.push(`${universe.id}_duel3`)
  if (progress.duel_wins >= 20) unlocked.push(`${universe.id}_duel4`)

  return unlocked
}

export function xpForSession(correct, total, isPerfect, isDuelWin) {
  let xp = correct * 15
  if (isPerfect) xp += 30
  if (isDuelWin) xp += 20
  return xp
}
