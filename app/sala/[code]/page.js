'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SalaPage() {
  const { code }  = useParams()
  const router    = useRouter()
  const supabase  = createClient()

  const [user,       setUser]      = useState(null)
  const [sala,       setSala]      = useState(null)
  const [results,    setResults]   = useState([])
  const [phase,      setPhase]     = useState('loading')   // loading | lobby | playing | done
  const [playerName, setName]      = useState('')
  const [qi,         setQi]        = useState(0)
  const [score,      setScore]     = useState(0)
  const [answered,   setAnswered]  = useState(false)
  const [learnData,  setLearn]     = useState(null)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const startTime = useRef(Date.now())
  const qTime     = useRef(Date.now())

  useEffect(() => {
    async function load() {
      // Get user (optional — guests can play too)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) setName(user.user_metadata?.full_name?.split(' ')[0] || '')

      // Load sala
      const { data: room, error } = await supabase
        .from('duomity_rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (error || !room) { setPhase('notfound'); return }
      setSala(room)

      // Load results
      const { data: res } = await supabase
        .from('duomity_room_results')
        .select('*')
        .eq('room_id', room.id)
        .order('score', { ascending: false })
      setResults(res || [])

      // Check if this user already played
      if (user) {
        const played = (res || []).some(r => r.user_id === user.id)
        if (played) { setAlreadyPlayed(true); setPhase('done'); return }
      }

      setPhase('lobby')
    }
    load()
  }, [code])

  function startPlaying() {
    if (!playerName.trim()) return
    startTime.current = Date.now()
    qTime.current = Date.now()
    setPhase('playing')
  }

  function answer(idx) {
    if (answered) return
    const q = sala.questions[qi]
    const ok = idx === q.a
    if (ok) setScore(s => s + 1)
    setAnswered(true)
    setLearn({ ok, q, answer: q.o[q.a] })
  }

  async function next() {
    const isLast = qi + 1 >= sala.questions.length
    if (isLast) {
      // Save result
      const secs = Math.round((Date.now() - startTime.current) / 1000)
      const finalScore = score + (learnData?.ok ? 0 : 0) // score already updated
      await supabase.from('duomity_room_results').insert({
        room_id:      sala.id,
        player_name:  playerName.trim(),
        user_id:      user?.id || null,
        score:        score,
        total:        sala.questions.length,
        time_seconds: secs,
      })
      // Reload results
      const { data: res } = await supabase
        .from('duomity_room_results')
        .select('*')
        .eq('room_id', sala.id)
        .order('score', { ascending: false })
      setResults(res || [])
      setPhase('done')
    } else {
      setQi(q => q + 1)
      setAnswered(false)
      setLearn(null)
      qTime.current = Date.now()
    }
  }

  // ── LOADING ──
  if (phase === 'loading') return (
    <div className="loading">Cargando sala…</div>
  )

  // ── NOT FOUND ──
  if (phase === 'notfound') return (
    <div className="app-shell" style={{ textAlign:'center', paddingTop:'4rem' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", color:'var(--text)', marginBottom:8 }}>Sala no encontrada</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'1.5rem' }}>El código <strong>{code}</strong> no existe o ya expiró.</p>
      <button className="btn-primary" onClick={() => router.push('/home')}>Volver al inicio</button>
    </div>
  )

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <main className="app-shell" style={{ paddingTop:'2rem' }}>
      <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
        <span style={{ fontSize:48 }}>{sala.universe_icon}</span>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--text)', margin:'8px 0 4px' }}>
          {sala.universe_name}
        </h1>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>
          Sala <strong style={{ color:'var(--accent)', letterSpacing:2 }}>{sala.code}</strong> · {sala.questions.length} preguntas · creada por {sala.creator_name}
        </p>
      </div>

      {/* Leaderboard preview */}
      {results.length > 0 && (
        <div className="card" style={{ marginBottom:'1.25rem' }}>
          <div className="section-label" style={{ marginBottom:'0.75rem' }}>Jugaron hasta ahora</div>
          {results.map((r, i) => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:16, width:24, textAlign:'center' }}>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
              <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>{r.player_name}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--accent)' }}>{r.score}/{r.total}</span>
            </div>
          ))}
        </div>
      )}

      {/* Name input */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <div className="section-label" style={{ marginBottom:'0.75rem' }}>Tu nombre</div>
        <input
          className="player-name-input"
          value={playerName}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startPlaying()}
          placeholder="Ingresá tu nombre para jugar"
          maxLength={20}
          style={{ fontSize:16, padding:'8px 0' }}
        />
      </div>

      <button className="btn-primary" onClick={startPlaying} disabled={!playerName.trim()}>
        ⚔️ Jugar ahora
      </button>
    </main>
  )

  // ── PLAYING ──
  if (phase === 'playing') {
    const q = sala.questions[qi]
    const total = sala.questions.length
    return (
      <main className="app-shell">
        {/* Header */}
        <div className="quiz-header">
          <div style={{ fontSize:24 }}>{sala.universe_icon}</div>
          <div className="quiz-meta">
            <div className="quiz-universe-name">{sala.universe_name} · Sala {sala.code}</div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width:(qi/total*100)+'%', background:'var(--accent)' }} />
            </div>
          </div>
          <div className="quiz-counter">{qi+1}/{total}</div>
        </div>

        <div className="q-card">
          <p className="q-text">{q.q}</p>
        </div>

        <div className="opts-multiple" style={{ marginBottom:'0.75rem' }}>
          {q.o.map((opt, i) => (
            <button key={i}
              className={`opt${answered ? (i===q.a ? ' correct' : learnData && !learnData.ok && i!==q.a ? '' : '') : ''}`}
              onClick={() => answer(i)}
              disabled={answered}
            >
              {opt}
            </button>
          ))}
        </div>

        {learnData && (
          <div className={`learn-panel ${learnData.ok ? 'correct' : 'wrong'}`}>
            <div className="lp-top">
              <span className="lp-verdict">{learnData.ok ? '✓ Correcto' : '✗ Incorrecto'}</span>
              {!learnData.ok && <span className="lp-answer">Respuesta: {learnData.answer}</span>}
            </div>
            {learnData.q.exp && (
              <>
                <div className="lp-divider" />
                <div className="lp-body">{learnData.q.exp}</div>
              </>
            )}
          </div>
        )}

        {answered && (
          <button className="next-btn" onClick={next}>
            {qi+1 >= total ? '🏆 Ver resultados' : 'Siguiente →'}
          </button>
        )}
      </main>
    )
  }

  // ── DONE / LEADERBOARD ──
  const myResult = alreadyPlayed
    ? results.find(r => r.user_id === user?.id)
    : results[0] // just played = most recent insert, but we sort by score so find by name
  const myScore = results.find(r => r.player_name === playerName)

  const myPos = myScore ? results.findIndex(r => r.id === myScore.id) + 1 : null

  return (
    <main className="app-shell" style={{ paddingTop:'2rem' }}>
      <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
        <span style={{ fontSize:48, display:'block', animation:'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>🏆</span>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--text)', margin:'8px 0 4px' }}>
          {alreadyPlayed ? 'Ya jugaste esta sala' : '¡Partida terminada!'}
        </h1>
        {myScore && !alreadyPlayed && (
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>
            {myScore.score}/{myScore.total} correctas
            {myPos && <> · Posición <strong style={{ color:'var(--accent)' }}>#{myPos}</strong></>}
          </p>
        )}
      </div>

      {/* Full leaderboard */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="section-label" style={{ marginBottom:'0.75rem' }}>
          Leaderboard · {sala.universe_icon} {sala.universe_name}
        </div>
        {results.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>Todavía nadie más jugó.</p>
        ) : results.map((r, i) => (
          <div key={r.id} style={{
            display:'flex', alignItems:'center', gap:12, padding:'10px 0',
            borderBottom:'1px solid var(--border)',
            background: myScore && r.id === myScore.id ? 'var(--accent-soft)' : 'transparent',
            borderRadius: myScore && r.id === myScore.id ? 'var(--radius-sm)' : 0,
            padding: myScore && r.id === myScore.id ? '10px 8px' : '10px 0',
          }}>
            <span style={{ fontSize:20, width:28, textAlign:'center' }}>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
            <span style={{ flex:1, fontSize:14, fontWeight: myScore && r.id===myScore.id ? 600 : 400, color: myScore && r.id===myScore.id ? 'var(--accent)' : 'var(--text)' }}>
              {r.player_name} {myScore && r.id===myScore.id && '(vos)'}
            </span>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>
              {r.time_seconds ? `${Math.floor(r.time_seconds/60)}m ${r.time_seconds%60}s` : ''}
            </span>
            <span style={{ fontSize:16, fontWeight:600, color:'var(--accent)', minWidth:36, textAlign:'right' }}>
              {r.score}/{r.total}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button className="btn-primary" onClick={() => { setPhase('lobby'); setScore(0); setQi(0); setAnswered(false); setLearn(null) }}
          style={{ flex:1 }} disabled={alreadyPlayed}>
          Jugar de nuevo
        </button>
        <button className="btn-secondary" onClick={() => router.push('/home')} style={{ flex:1 }}>
          Inicio
        </button>
      </div>
    </main>
  )
}
