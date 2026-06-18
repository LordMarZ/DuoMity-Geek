'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UNIVERSES, getUniverseById } from '@/lib/universes'
import { pickQuestions } from '@/lib/questionLoader'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function QuizContent() {
  const router       = useRouter()
  const params       = useSearchParams()
  const supabase     = createClient()

  const mode   = params.get('mode')   || 'clasico'
  const solo   = params.get('solo')   === '1'
  const p1Name = params.get('p1')     || 'Jugador 1'
  const p2Name = params.get('p2')     || 'Jugador 2'
  const univId = params.get('univ')   || ''
  const univP1 = params.get('univP1') || ''
  const univP2 = params.get('univP2') || ''

  // Game state
  const [user, setUser]         = useState(null)
  const [questions, setQuestions] = useState([])   // flat list of all questions in sequence
  const [qi, setQi]             = useState(0)      // current question index
  const [currentPlayer, setCP]  = useState(1)      // 1 or 2 (for turn-based modes)
  const [scores, setScores]     = useState({ p1: 0, p2: 0 })
  const [answered, setAnswered] = useState(false)
  const [lastCorrect, setLC]    = useState(null)
  const [learnData, setLearnData] = useState(null)
  const [streak, setStreak]     = useState({ p1: 0, p2: 0 })
  const [sessionLog, setLog]    = useState([])

  // Duelo mode
  const [buzzed, setBuzzed]     = useState(null)   // null | 'p1' | 'p2'
  const [duelTimer, setDuelTimer]= useState(8)
  const duelTimerRef            = useRef(null)

  // Timing for speed achievements
  const qStartTime              = useRef(Date.now())
  const [fastAnswers, setFast]  = useState({ p1: [], p2: [] }) // ms per correct answer

  const universe = getUniverseById(univId || univP1)
  const uniColor = universe?.color || '#c8a96e'
  const uniSoft  = universe?.colorSoft || 'rgba(200,169,110,0.12)'
  const uniBd    = universe?.colorBorder || 'rgba(200,169,110,0.3)'

  // Build question list on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      let qs = []
      if (mode === 'elquemassabe') {
        // P1 gets 10 from their universe, P2 gets 10 from theirs, interleaved
        const qp1 = pickQuestions(univP1, 10).map(q => ({ ...q, owner: 'p1' }))
        const qp2 = pickQuestions(univP2, 10).map(q => ({ ...q, owner: 'p2' }))
        qs = []
        for (let i = 0; i < 10; i++) {
          if (qp1[i]) qs.push(qp1[i])
          if (qp2[i]) qs.push(qp2[i])
        }
      } else if (mode === 'canonicofalso') {
        qs = pickQuestions(univId, 20, 'tf').map((q, i) => ({ ...q, owner: i % 2 === 0 ? 'p1' : 'p2' }))
        if (qs.length < 4) {
          // fallback: all questions if not enough tf
          qs = pickQuestions(univId, 20).map((q, i) => ({ ...q, owner: solo ? 'p1' : (i % 2 === 0 ? 'p1' : 'p2') }))
        }
      } else {
        // Clásico and Duelo: 20 questions alternating
        qs = pickQuestions(univId, 20).map((q, i) => ({ ...q, owner: solo ? 'p1' : (i % 2 === 0 ? 'p1' : 'p2') }))
      }
      setQuestions(qs)
    }
    init()
  }, [])

  // Start duelo timer when question renders
  useEffect(() => {
    if (mode !== 'duelo' || answered || questions.length === 0) return
    setBuzzed(null)
    setDuelTimer(8)
    qStartTime.current = Date.now()
    clearInterval(duelTimerRef.current)
    duelTimerRef.current = setInterval(() => {
      setDuelTimer(t => {
        if (t <= 1) {
          clearInterval(duelTimerRef.current)
          // Time's up — no one answered
          handleNoAnswer()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(duelTimerRef.current)
  }, [qi, questions.length, answered])

  function handleNoAnswer() {
    if (answered) return
    setAnswered(true)
    setBuzzed(null)
    const q = questions[qi]
    setLearnData({ ok: false, q, correctAnswer: q.t === 'tf' ? (q.a ? 'Verdadero' : 'Falso') : q.o[q.a] })
    setLog(prev => [...prev, { q: q.q, correct: false, player: currentPlayer, exp: q.exp }])
  }

  function handleBuzz(player) {
    if (buzzed || answered) return
    clearInterval(duelTimerRef.current)
    setBuzzed(player)
  }

  function answerM(idx) {
    if (answered) return
    const q = questions[qi]
    const player = mode === 'duelo' ? buzzed : (q.owner === 'p1' ? 'p1' : 'p2')
    const ok = idx === q.a
    processAnswer(ok, q, ok ? null : q.o[q.a], player)
  }

  function answerTF(val) {
    if (answered) return
    const q = questions[qi]
    const player = mode === 'duelo' ? buzzed : (q.owner === 'p1' ? 'p1' : 'p2')
    const ok = val === q.a
    processAnswer(ok, q, ok ? null : (q.a ? 'Verdadero' : 'Falso'), player)
  }

  function processAnswer(ok, q, correctAnswer, player) {
    setAnswered(true)
    clearInterval(duelTimerRef.current)
    const ms = Date.now() - qStartTime.current

    if (ok) {
      setScores(s => ({ ...s, [player]: s[player] + 1 }))
      setStreak(s => ({ ...s, [player]: s[player] + 1 }))
      setFast(f => ({ ...f, [player]: [...f[player], ms] }))
    } else {
      setStreak(s => ({ ...s, [player]: 0 }))
    }
    setLC(ok)
    setLearnData({ ok, q, correctAnswer })
    setLog(prev => [...prev, { q: q.q, correct: ok, player, exp: q.exp, ms }])

    // In duelo, if buzzed player is wrong, other player can answer (simplified: just move on)
  }

  function nextQuestion() {
    if (qi + 1 >= questions.length) {
      // Game over — go to result
      const resultParams = new URLSearchParams({
        mode,
        solo: solo ? '1' : '0',
        p1: p1Name, p2: p2Name,
        sp1: scores.p1 + (lastCorrect && questions[qi]?.owner === 'p1' ? 0 : 0),
        sp2: scores.p2,
        univ: univId || univP1,
        univP1, univP2,
        log: JSON.stringify(sessionLog),
      })
      router.push(`/result?${resultParams.toString()}`)
      return
    }
    setQi(q => q + 1)
    setAnswered(false)
    setLearnData(null)
    setLC(null)
    setBuzzed(null)
    qStartTime.current = Date.now()

    // Update current player for display
    const nextQ = questions[qi + 1]
    if (nextQ) setCP(nextQ.owner === 'p1' ? 1 : 2)
  }

  if (questions.length === 0) return <div className="loading">Preparando preguntas…</div>

  const q = questions[qi]
  const total = questions.length
  const playerLabel = currentPlayer === 1 ? p1Name : p2Name
  const universeForQ = getUniverseById(q.owner === 'p1' ? (univP1 || univId) : (univP2 || univId))
  const qUniColor = universeForQ?.color || uniColor

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <div className="app-shell" style={{ '--uni': qUniColor, '--uni-soft': universeForQ?.colorSoft || uniSoft, '--uni-bd': universeForQ?.colorBorder || uniBd }}>

        {/* Header */}
        <div className="quiz-header">
          <button className="back-btn" onClick={() => router.push('/home')}>←</button>
          <div className="quiz-meta">
            <div className="quiz-universe-name">
              {universeForQ?.icon} {universeForQ?.name}
              {mode !== 'clasico' && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>· {GAME_MODES_MAP[mode]}</span>}
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: (qi / total * 100) + '%', background: qUniColor }} />
            </div>
          </div>
          <div className="quiz-counter">{qi + 1} / {total}</div>
        </div>

        {/* Score strip */}
        <div className="score-strip" style={solo ? {gridTemplateColumns:'1fr'} : {}}>
          <div className={`score-p${q.owner === 'p1' ? ' active' : ''}`}>
            <div className="score-p-label">P1</div>
            <div className="score-p-name">{p1Name}</div>
            <div className="score-p-pts">{scores.p1}</div>
            {streak.p1 >= 2 && <div className="streak-badge">🔥×{streak.p1}</div>}
          </div>
          {!solo && <div style={{ color: 'var(--text-dim)', fontSize: 12, alignSelf: 'center', padding: '0 4px' }}>vs</div>}
          {!solo && <div className={`score-p${q.owner === 'p2' ? ' active' : ''}`}>
            <div className="score-p-label">P2</div>
            <div className="score-p-name">{p2Name}</div>
            <div className="score-p-pts">{scores.p2}</div>
            {streak.p2 >= 2 && <div className="streak-badge">🔥×{streak.p2}</div>}
          </div>}

        </div>

        {/* Turn indicator (non-duelo modes) */}
        {!solo && mode !== 'duelo' && !answered && (
          <div className="turn-indicator">
            👤 Turno de {q.owner === 'p1' ? p1Name : p2Name}
          </div>
        )}

        {/* Duelo mode: buzz interface */}
        {mode === 'duelo' && !buzzed && !answered && (
          <div className="duelo-layout" style={{ marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--red)', fontFamily: 'monospace' }}>
              ⏱ {duelTimer}s
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="buzz-zone p1" onClick={() => handleBuzz('p1')} style={{ flex: 1 }}>
                <div className="buzz-label">Jugador 1</div>
                <div className="buzz-name">{p1Name}</div>
                <div className="buzz-btn-label" style={{ color: '#6ea8c8' }}>¡YO SÉ!</div>
              </div>
              <div className="buzz-zone p2" onClick={() => handleBuzz('p2')} style={{ flex: 1 }}>
                <div className="buzz-label">Jugador 2</div>
                <div className="buzz-name">{p2Name}</div>
                <div className="buzz-btn-label" style={{ color: 'var(--accent)' }}>¡YO SÉ!</div>
              </div>
            </div>
          </div>
        )}

        {mode === 'duelo' && buzzed && !answered && (
          <div className="turn-indicator">
            ⚡ {buzzed === 'p1' ? p1Name : p2Name} buzzeó primero — respondé ahora
          </div>
        )}

        {/* Question */}
        <div className="q-type-badge-wrap" style={{ marginBottom: '0.5rem' }}>
          {q.t === 'tf'
            ? <span className="q-type-badge truefalse">◐ Verdadero o Falso</span>
            : <span className="q-type-badge multiple">⊞ Opción múltiple</span>
          }
        </div>

        <div className="q-card">
          <p className="q-text">{q.q}</p>
        </div>

        {/* Options — only show if not duelo waiting for buzz */}
        {(mode !== 'duelo' || buzzed || answered) && (
          <>
            {q.t === 'tf' ? (
              <div className="opts-tf">
                <button className="opt-tf" onClick={() => answerTF(true)} disabled={answered}>
                  <span className="tf-icon">✓</span>Verdadero
                </button>
                <button className="opt-tf" onClick={() => answerTF(false)} disabled={answered}>
                  <span className="tf-icon">✗</span>Falso
                </button>
              </div>
            ) : (
              <div className="opts-multiple">
                {q.o.map((opt, i) => (
                  <button
                    key={i}
                    className={`opt${answered ? (i === q.a ? ' correct' : learnData && !learnData.ok && i === (mode === 'duelo' ? learnData?.chosenIdx : null) ? ' wrong' : '') : ''}`}
                    onClick={() => answerM(i)}
                    disabled={answered}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Learn panel */}
        {learnData && (
          <div className={`learn-panel ${learnData.ok ? 'correct' : 'wrong'}`}>
            <div className="lp-top">
              <span className="lp-verdict">{learnData.ok ? '✓ Correcto' : '✗ Incorrecto'}</span>
              {!learnData.ok && learnData.correctAnswer && (
                <span className="lp-answer">Respuesta: {learnData.correctAnswer}</span>
              )}
            </div>
            <div className="lp-divider" />
            <div className="lp-body">
              {learnData.q.exp && (() => {
                const exp = learnData.q.exp
                const dot = exp.indexOf('.')
                return dot > 0 && dot < exp.length - 1
                  ? <><strong>{exp.slice(0, dot + 1)}</strong>{exp.slice(dot + 1)}</>
                  : exp
              })()}
              {learnData.q.extra && (
                <div className="lp-extra">
                  <span>¿Sabías que?</span> {learnData.q.extra}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button className="next-btn" onClick={nextQuestion}>
            {qi + 1 >= total ? '🏆 Ver resultados' : 'Siguiente pregunta →'}
          </button>
        )}

      </div>
    </div>
  )
}

const GAME_MODES_MAP = {
  clasico: 'Clásico',
  elquemassabe: 'El que más sabe',
  canonicofalso: 'Canónico o Falso',
  duelo: 'Modo Duelo',
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="loading">Cargando preguntas…</div>}>
      <QuizContent />
    </Suspense>
  )
}
