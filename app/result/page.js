'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { GLOBAL_ACHIEVEMENTS, xpForSession } from '@/lib/achievements'
import { getUniverseById } from '@/lib/universes'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function ResultContent() {
  const router  = useRouter()
  const params  = useSearchParams()
  const supabase = createClient()

  const mode  = params.get('mode')  || 'clasico'
  const p1    = params.get('p1')    || 'Jugador 1'
  const p2    = params.get('p2')    || 'Jugador 2'
  const sp1   = parseInt(params.get('sp1') || '0')
  const sp2   = parseInt(params.get('sp2') || '0')
  const solo  = params.get('solo') === '1'
  const univId= params.get('univ')  || ''
  const univP1= params.get('univP1') || ''
  const univP2= params.get('univP2') || ''

  const [user, setUser]         = useState(null)
  const [newAchs, setNewAchs]   = useState([])   // newly unlocked achievements
  const [xpEarned, setXpEarned] = useState(0)
  const [saved, setSaved]       = useState(false)

  const universe  = getUniverseById(univId || univP1)
  const uniColor  = universe?.color || '#c8a96e'
  const totalQ    = sp1 + sp2 + Math.max(0, 20 - sp1 - sp2) // approx
  const isPerfect = mode !== 'elquemassabe' && (sp1 >= 10 || sp2 >= 10)
  const winner    = sp1 > sp2 ? 'p1' : sp2 > sp1 ? 'p2' : 'draw'

  useEffect(() => {
    async function saveProgress() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const xp = xpForSession(sp1, 10, sp1 >= 10, winner === 'p1')
      setXpEarned(xp)

      const uniToSave = univId || univP1 || null

      if (uniToSave) {
        // Upsert progress for P1's universe
        const { data: existing } = await supabase
          .from('duomity_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('universe_id', uniToSave)
          .single()

        const newCorrect = (existing?.correct_total || 0) + sp1
        const newSessions = (existing?.sessions_played || 0) + 1
        const newPerfect  = (existing?.perfect_rounds || 0) + (sp1 >= 10 ? 1 : 0)
        const newDuelWins = (existing?.duel_wins || 0) + (mode === 'duelo' && winner === 'p1' ? 1 : 0)
        const newXP       = (existing?.xp || 0) + xp

        await supabase.from('duomity_progress').upsert({
          user_id: user.id,
          universe_id: uniToSave,
          correct_total: newCorrect,
          sessions_played: newSessions,
          perfect_rounds: newPerfect,
          duel_wins: newDuelWins,
          xp: newXP,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,universe_id' })

        // Check global achievements
        const { data: allProgress } = await supabase
          .from('duomity_progress')
          .select('*')
          .eq('user_id', user.id)

        const { data: existingAchs } = await supabase
          .from('duomity_achievements')
          .select('achievement_id')
          .eq('user_id', user.id)

        const earnedIds = new Set((existingAchs || []).map(a => a.achievement_id))

        const totalCorrect    = (allProgress || []).reduce((s, p) => s + (p.correct_total || 0), 0) + sp1
        const universesPlayed = [...new Set((allProgress || []).map(p => p.universe_id))]
        const totalSessions   = (allProgress || []).reduce((s, p) => s + (p.sessions_played || 0), 0) + 1
        const totalPerfect    = (allProgress || []).reduce((s, p) => s + (p.perfect_rounds || 0), 0)
        const availableCount  = 9 // universes with questions

        const stats = { totalCorrect, universesPlayed, totalSessions, totalPerfectRounds: totalPerfect }

        const newlyUnlocked = []
        for (const ach of GLOBAL_ACHIEVEMENTS) {
          if (!earnedIds.has(ach.id) && ach.check(stats, availableCount)) {
            newlyUnlocked.push(ach)
            await supabase.from('duomity_achievements').upsert({
              user_id: user.id,
              achievement_id: ach.id,
              unlocked_at: new Date().toISOString(),
            }, { onConflict: 'user_id,achievement_id' })
          }
        }
        setNewAchs(newlyUnlocked)
      }

      setSaved(true)
    }
    saveProgress()
  }, [])

  return (
    <>
      <Navbar user={user} />
      <main className="app-shell" style={{ '--uni': uniColor }}>

        {/* Result hero */}
        <div className="result-hero">
          <span className="result-icon">
            {solo ? '🏆' : winner === 'draw' ? '🤝' : winner === 'p1' ? '🏆' : '🥇'}
          </span>
          <h1 className="result-title">
            {solo ? `${sp1} correctas` : winner === 'draw' ? '¡Empate épico!' : `¡${winner === 'p1' ? p1 : p2} ganó!`}
          </h1>
          <p className="result-sub">
            {universe?.icon} {universe?.name} · {mode === 'clasico' ? 'Modo Clásico' : mode === 'duelo' ? 'Modo Duelo' : mode === 'canonicofalso' ? 'Canónico o Falso' : 'El que más sabe'}
          </p>
        </div>

        {/* Score comparison */}
        <div className="result-scores" style={{ marginBottom: '1rem', gridTemplateColumns: solo ? '1fr' : undefined }}>
          <div className={`result-player${winner === 'p1' ? ' winner' : ''}`}>
            <div className="rp-name">{p1}</div>
            <div className="rp-score">{sp1}</div>
            {xpEarned > 0 && winner === 'p1' && <div className="rp-xp">+{xpEarned} XP</div>}
          </div>
          {!solo && <div className="result-vs">vs</div>}
          {!solo && <div className={`result-player${winner === 'p2' ? ' winner' : ''}`}><div className="rp-name">{p2}</div><div className="rp-score">{sp2}</div></div>}
        </div>

        {/* Stats */}
        <div className="result-stats" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-val">{sp1 + sp2}</div>
            <div className="stat-lbl">Correctas</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{Math.round((solo ? sp1 : sp1 + sp2) / 20 * 100)}%</div>
            <div className="stat-lbl">Precisión</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">+{xpEarned}</div>
            <div className="stat-lbl">XP ganado</div>
          </div>
        </div>

        {/* New achievements */}
        {newAchs.length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--accent-bd)' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>🏅 Logros desbloqueados</div>
            {newAchs.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)' }}>+{a.xp} XP</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <button className="btn-primary" style={{ marginBottom: 8 }} onClick={() => router.push(`/home`)}>
          🔄 Nueva partida
        </button>
        <button className="btn-secondary" onClick={() => router.push('/achievements')}>
          🏅 Ver todos mis logros
        </button>

      <Footer />
      </main>
    </>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="loading">Cargando resultado…</div>}>
      <ResultContent />
    </Suspense>
  )
}
