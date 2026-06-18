'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { UNIVERSES, CATEGORIES, GAME_MODES } from '@/lib/universes'
import { getQuestionCount } from '@/lib/questionLoader'

// Default top universes when there's no play data yet
const DEFAULT_TOP = ['got', 'naruto', 'breakingbad', 'strangerthings', 'lotr', 'dragonball']

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [progress, setProgress]   = useState({})       // universeId → {correct_total, ...}
  const [achievements, setAch]    = useState([])       // achievement IDs unlocked

  const [p1Name, setP1Name]       = useState('')
  const [p2Name, setP2Name]       = useState('Jugador 2')
  const [univId, setUnivId]       = useState(null)     // selected universe for classic/duelo/falso
  const [univP1, setUnivP1]       = useState(null)     // "el que más sabe" P1 universe
  const [univP2, setUnivP2]       = useState(null)     // "el que más sabe" P2 universe
  const [mode, setMode]           = useState('clasico')
  const [selCategory, setSelCat]  = useState('top')  // default: más jugados
  const [topUnivIds,  setTopIds]   = useState([])     // active category filter (null = all)
  const [soloMode, setSoloMode]  = useState(true)
  const [reqText, setReqText]     = useState('')
  const [reqSent, setReqSent]     = useState(false)
  const [reqLoading, setReqLoading] = useState(false)
  const [topRequests, setTopReqs] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setP1Name(user.user_metadata?.full_name?.split(' ')[0] || 'Jugador 1')

      // Load user progress
      const { data: prog } = await supabase
        .from('duomity_progress')
        .select('*')
        .eq('user_id', user.id)

      const progMap = {}
      ;(prog || []).forEach(p => { progMap[p.universe_id] = p })
      setProgress(progMap)

      // Load achievements
      const { data: ach } = await supabase
        .from('duomity_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)
      setAch((ach || []).map(a => a.achievement_id))

      // Load top 6 most played universes globally
      const { data: topData } = await supabase
        .from('duomity_progress')
        .select('universe_id, sessions_played')
        .order('sessions_played', { ascending: false })

      if (topData && topData.length > 0) {
        // Aggregate by universe
        const agg = {}
        topData.forEach(p => {
          agg[p.universe_id] = (agg[p.universe_id] || 0) + (p.sessions_played || 0)
        })
        const sorted = Object.entries(agg).sort((a,b) => b[1]-a[1]).slice(0,6).map(e => e[0])
        setTopIds(sorted.length >= 3 ? sorted : DEFAULT_TOP)
      } else {
        setTopIds(DEFAULT_TOP)
      }

      // Load top universe requests
      const { data: reqs } = await supabase
        .from('duomity_universe_requests')
        .select('universe, votes')
        .order('votes', { ascending: false })
        .limit(5)
      setTopReqs(reqs || [])

      setLoading(false)
    }
    load()
  }, [])

  function canStart() {
    if (!mode) return false
    if (mode === 'elquemassabe') return univP1 && univP2
    return !!univId
  }

  async function sendRequest() {
    if (!reqText.trim() || reqLoading) return
    setReqLoading(true)
    // Check if same universe already requested
    const { data: existing } = await supabase
      .from('duomity_universe_requests')
      .select('id, votes')
      .ilike('universe', reqText.trim())
      .single()

    if (existing) {
      await supabase
        .from('duomity_universe_requests')
        .update({ votes: existing.votes + 1 })
        .eq('id', existing.id)
    } else {
      await supabase.from('duomity_universe_requests').insert({
        universe: reqText.trim(),
        user_id: user?.id,
        user_name: p1Name || user?.user_metadata?.full_name || 'Anónimo',
      })
    }
    setReqSent(true)
    setReqText('')
    setReqLoading(false)
    // Refresh top requests
    const { data: reqs } = await supabase
      .from('duomity_universe_requests')
      .select('universe, votes')
      .order('votes', { ascending: false })
      .limit(5)
    setTopReqs(reqs || [])
  }

  function startGame() {
    if (!canStart()) return
    const params = new URLSearchParams({
      mode,
      solo: soloMode ? '1' : '0',
      p1: p1Name || 'Jugador 1',
      p2: p2Name || 'Jugador 2',
      univ: univId || '',
      univP1: univP1 || '',
      univP2: univP2 || '',
    })
    router.push(`/quiz?${params.toString()}`)
  }

  if (loading) return <div className="loading">Cargando…</div>

  const availableUniverses = UNIVERSES.filter(u => u.available)
  const totalCorrect = Object.values(progress).reduce((s, p) => s + (p.correct_total || 0), 0)
  const totalXP      = Object.values(progress).reduce((s, p) => s + (p.xp || 0), 0)

  // Filter universes by selected category
  const filteredUniverses = selCategory === 'top'
    ? UNIVERSES.filter(u => topUnivIds.includes(u.id))
    : selCategory
      ? UNIVERSES.filter(u => u.categoryId === selCategory)
      : UNIVERSES.filter(u => u.showInAll !== false)

  return (
    <>
      <Navbar user={user} />
      <main className="app-shell">

        {/* Header */}
        <div className="page-top">
          <div className="page-logo-row">
            <div className="page-logo-icon">☠️</div>
            <div>
              <div className="page-title">Duo<span>Mity</span></div>
              <div className="page-sub">Geek Edition</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:'0.5rem' }}>
            <span style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'1px' }}>by</span>
            <img
              src="/logo-white.png"
              alt="Darkside Bros"
              style={{ height:18, width:'auto', mixBlendMode:'screen' }}
              onError={e => { e.target.src='/logo.png'; e.target.onerror=()=>e.target.style.display='none' }}
            />
            <span style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'1px', textTransform:'uppercase' }}>Darkside Bros Café</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="xp-bar-wrap" style={{ marginBottom: '1.5rem' }}>
          <div className="xp-num">{totalXP}</div>
          <div className="xp-col">
            <div className="xp-label">XP total · {totalCorrect} respuestas correctas</div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: Math.min(100, (totalXP % 500) / 5) + '%' }} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <a href="/achievements" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              {achievements.length} logros ›
            </a>
          </div>
        </div>

        {/* Crear sala async */}
        <div style={{ marginBottom:'1.25rem' }}>
          <button
            onClick={() => router.push('/sala/create')}
            style={{
              width:'100%', padding:'0.9rem',
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', fontFamily:'inherit',
              fontSize:14, fontWeight:500, color:'var(--text-muted)',
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', gap:8, transition:'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-md)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            🌐 Crear sala con QR — jugá con amigos de forma asincrónica
          </button>
        </div>

        {/* Solo / Duo toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
          <button
            onClick={() => setSoloMode(false)}
            style={{
              flex:1, padding:'0.75rem', borderRadius:'var(--radius)', fontFamily:'inherit',
              fontSize:14, fontWeight:500, cursor:'pointer',
              background: !soloMode ? 'var(--accent-soft)' : 'var(--surface)',
              border: `1px solid ${!soloMode ? 'var(--accent-bd)' : 'var(--border)'}`,
              color: !soloMode ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >⚔️ 2 Jugadores</button>
          <button
            onClick={() => setSoloMode(true)}
            style={{
              flex:1, padding:'0.75rem', borderRadius:'var(--radius)', fontFamily:'inherit',
              fontSize:14, fontWeight:500, cursor:'pointer',
              background: soloMode ? 'var(--accent-soft)' : 'var(--surface)',
              border: `1px solid ${soloMode ? 'var(--accent-bd)' : 'var(--border)'}`,
              color: soloMode ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >🎮 1 Jugador</button>
        </div>

        {/* Players */}
        <div className="section-label">Jugadores</div>
        <div className="players-row">
          <div className="player-card">
            <div className="player-label">Jugador 1</div>
            <input
              className="player-name-input"
              value={p1Name}
              onChange={e => setP1Name(e.target.value)}
              placeholder="Tu nombre"
              maxLength={20}
            />
          </div>
          {!soloMode && <div className="vs-badge">VS</div>}
          {!soloMode && (
            <div className="player-card">
              <div className="player-label">Jugador 2</div>
              <input
                className="player-name-input"
                value={p2Name}
                onChange={e => setP2Name(e.target.value)}
                placeholder="Rival"
                maxLength={20}
              />
            </div>
          )}
        </div>

        {/* Game Mode */}
        <div className="section-label">Modo de juego</div>
        <div className="mode-grid" style={{ marginBottom: '1.5rem' }}>
          {GAME_MODES.map(m => (
            <div
              key={m.id}
              className={`mode-card${mode === m.id ? ' selected' : ''}`}
              style={mode === m.id ? { '--uni-soft':'rgba(200,169,110,0.12)', '--uni-bd':'rgba(200,169,110,0.3)' } : {}}
              onClick={() => setMode(m.id)}
            >
              <div className="mode-icon">{m.icon}</div>
              <div className="mode-name">{m.name}</div>
              <div className="mode-desc">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Universe selector */}
        {mode !== 'elquemassabe' && (
          <>
            <div className="section-label">
              {mode === 'canonicofalso' ? 'Universo (sólo preguntas V/F)' : 'Universo'}
            </div>

            {/* Category filter chips */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'0.9rem' }}>
              <button
                onClick={() => { setSelCat('top'); setUnivId(null) }}
                style={{
                  background: selCategory === 'top' ? 'var(--accent-soft)' : 'var(--surface)',
                  border: `1px solid ${selCategory === 'top' ? 'var(--accent-bd)' : 'var(--border)'}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500,
                  color: selCategory === 'top' ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🔥 Más jugados
              </button>
              {CATEGORIES.map(cat => {
                const active = selCategory === cat.id
                const hasAvailable = UNIVERSES.some(u => u.categoryId === cat.id && u.available)
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelCat(active ? null : cat.id); setUnivId(null) }}
                    style={{
                      background: active ? 'var(--accent-soft)' : 'var(--surface)',
                      border: `1px solid ${active ? 'var(--accent-bd)' : 'var(--border)'}`,
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500,
                      color: active ? 'var(--accent)' : hasAvailable ? 'var(--text-muted)' : 'var(--text-dim)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      opacity: hasAvailable ? 1 : 0.55,
                    }}
                    title={cat.desc}
                  >
                    {cat.icon} {cat.name}
                  </button>
                )
              })}
            </div>

            <div className="universe-grid">
              {filteredUniverses.map(u => {
                const count    = getQuestionCount(u.id)
                const prog     = progress[u.id]
                const pct      = Math.min(100, ((prog?.correct_total || 0) / Math.max(count, 1)) * 100)
                const isSelected = univId === u.id
                return (
                  <div
                    key={u.id}
                    className={`universe-card${!u.available ? ' disabled' : ''}`}
                    style={{
                      '--uni': u.color,
                      '--uni-soft': u.colorSoft,
                      '--uni-bd': u.colorBorder,
                      border: isSelected ? `2px solid ${u.color}` : '1px solid var(--border)',
                      background: isSelected ? u.colorSoft : 'var(--surface)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => u.available && setUnivId(isSelected ? null : u.id)}
                  >
                    {!u.available && <span className="uc-soon">Próximamente</span>}
                    {/* Colored top bar — full width when selected */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height: isSelected ? 4 : 2, background:u.color, borderRadius:'12px 12px 0 0', transition:'height .15s' }} />
                    <span className="uc-icon">{u.icon}</span>
                    <div className="uc-name" style={{ color: isSelected ? u.color : 'var(--text)', fontWeight: isSelected ? 600 : 500 }}>{u.name}</div>
                    <div className="uc-sub">{u.sub}</div>
                    {u.available && !isSelected && <div className="uc-count">{count} preguntas</div>}
                    {u.available && !isSelected && (
                      <div style={{ height:2, background:'var(--surface2)', borderRadius:1, marginTop:6, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:pct+'%', background:u.color, borderRadius:1 }} />
                      </div>
                    )}
                    {/* Start button inside card when selected */}
                    {isSelected && (
                      <button
                        onClick={e => { e.stopPropagation(); startGame() }}
                        style={{
                          marginTop: 8, width:'100%',
                          background: u.color, color:'#fff',
                          border:'none', borderRadius:'var(--radius-sm)',
                          padding:'7px 0', fontSize:12, fontWeight:600,
                          cursor:'pointer', letterSpacing:'.5px',
                        }}
                      >
                        ▶ Iniciar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* El que más sabe: dual universe selector */}
        {mode === 'elquemassabe' && (
          <>
            <div className="section-label">Universo de {p1Name || 'Jugador 1'}</div>
            <div className="universe-grid" style={{ marginBottom: '1.25rem' }}>
              {availableUniverses.map(u => (
                <div
                  key={u.id}
                  className={`universe-card${univP1 === u.id ? ' selected' : ''}`}
                  style={{ '--uni': u.color, '--uni-soft': u.colorSoft, '--uni-bd': u.colorBorder }}
                  onClick={() => setUnivP1(u.id)}
                >
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:u.color }} />
                  <span className="uc-icon">{u.icon}</span>
                  <div className="uc-name">{u.name}</div>
                </div>
              ))}
            </div>

            <div className="section-label">Universo de {p2Name || 'Jugador 2'}</div>
            <div className="universe-grid" style={{ marginBottom: '1.5rem' }}>
              {availableUniverses.map(u => (
                <div
                  key={u.id}
                  className={`universe-card${univP2 === u.id ? ' selected' : ''}`}
                  style={{ '--uni': u.color, '--uni-soft': u.colorSoft, '--uni-bd': u.colorBorder }}
                  onClick={() => setUnivP2(u.id)}
                >
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:u.color }} />
                  <span className="uc-icon">{u.icon}</span>
                  <div className="uc-name">{u.name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Universe request section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-label">¿Falta tu universo?</div>
          <div className="card" style={{ padding: '1.1rem' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              Pedinos un universo nuevo y lo sumamos al juego.
            </p>
            {!reqSent ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={reqText}
                  onChange={e => setReqText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendRequest()}
                  placeholder="Ej: Attack on Titan, Pokémon, The Office…"
                  maxLength={60}
                  style={{
                    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontFamily: 'inherit',
                    fontSize: 13, padding: '0.6rem 0.8rem', outline: 'none',
                  }}
                />
                <button
                  onClick={sendRequest}
                  disabled={!reqText.trim() || reqLoading}
                  style={{
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-bd)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 500, padding: '0.6rem 1rem', cursor: 'pointer',
                    opacity: !reqText.trim() ? 0.4 : 1,
                  }}
                >
                  {reqLoading ? '…' : 'Pedir ✨'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--green)', padding: '0.5rem 0' }}>
                ✓ ¡Pedido recibido! Lo tenemos en cuenta para la próxima tanda.{' '}
                <button onClick={() => setReqSent(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  Pedir otro
                </button>
              </div>
            )}
            {topRequests.length > 0 && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Más pedidos por la comunidad
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {topRequests.map((r, i) => (
                    <div key={i} style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12,
                      color: 'var(--text-muted)', display: 'flex', gap: 5, alignItems: 'center',
                    }}>
                      {r.universe}
                      <span style={{ color: 'var(--accent)', fontSize: 11 }}>+{r.votes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start button — only shown for elquemassabe or when no universe selected yet */}
        {(mode === 'elquemassabe' || !univId) && (
          <button
            className="btn-primary"
            onClick={startGame}
            disabled={!canStart()}
          >
            ⚔️ Comenzar partida
          </button>
        )}

      <Footer />
      </main>
    </>
  )
}
