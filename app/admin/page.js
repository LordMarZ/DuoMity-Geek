'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UNIVERSES } from '@/lib/universes'
import Navbar from '@/components/Navbar'

// ── Allowed admin emails (add yours here) ──────────────────────
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

// ── Small components ───────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'1rem 1.1rem' }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color, marginBottom:2 }}>{value ?? '—'}</div>
      <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:'1.75rem' }}>
      <div style={{ fontSize:11, fontWeight:500, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'0.75rem' }}>{title}</div>
      {children}
    </div>
  )
}

function BarRow({ label, icon, value, max, color, sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:13, color:'var(--text)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
          <span style={{ fontSize:13, color, fontWeight:600, marginLeft:8, flexShrink:0 }}>{value}</span>
        </div>
        <div style={{ height:3, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:color, borderRadius:2, transition:'width .6s' }} />
        </div>
        {sub && <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [user,   setUser]   = useState(null)
  const [data,   setData]   = useState(null)
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const email = user.email?.toLowerCase() || ''
      if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
        router.push('/home')
        return
      }
      setUser(user)

      // ── Fetch all stats in parallel ──────────────────────────
      const [
        { data: progress },
        { data: achievements },
        { data: requests },
        { data: rooms },
        { data: roomResults },
        { count: userCount },
      ] = await Promise.all([
        supabase.from('duomity_progress').select('*'),
        supabase.from('duomity_achievements').select('achievement_id, user_id'),
        supabase.from('duomity_universe_requests').select('universe, votes').order('votes', { ascending: false }),
        supabase.from('duomity_rooms').select('*').order('created_at', { ascending: false }),
        supabase.from('duomity_room_results').select('*').order('score', { ascending: false }),
        supabase.from('duomity_progress').select('*', { count: 'exact', head: true }),
      ])

      // ── Aggregate stats ──────────────────────────────────────

      // Total correctas y sesiones
      const totalCorrect   = (progress || []).reduce((s, p) => s + (p.correct_total || 0), 0)
      const totalSessions  = (progress || []).reduce((s, p) => s + (p.sessions_played || 0), 0)
      const totalXP        = (progress || []).reduce((s, p) => s + (p.xp || 0), 0)
      const uniqueUsers    = new Set((progress || []).map(p => p.user_id)).size

      // By universe
      const byUniverse = {}
      ;(progress || []).forEach(p => {
        if (!byUniverse[p.universe_id]) byUniverse[p.universe_id] = { sessions: 0, correct: 0, users: new Set() }
        byUniverse[p.universe_id].sessions += p.sessions_played || 0
        byUniverse[p.universe_id].correct  += p.correct_total  || 0
        byUniverse[p.universe_id].users.add(p.user_id)
      })
      const topUniverses = Object.entries(byUniverse)
        .map(([id, d]) => ({ id, sessions: d.sessions, correct: d.correct, users: d.users.size }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10)

      // Top players by XP
      const byUser = {}
      ;(progress || []).forEach(p => {
        if (!byUser[p.user_id]) byUser[p.user_id] = { xp: 0, correct: 0, sessions: 0 }
        byUser[p.user_id].xp       += p.xp || 0
        byUser[p.user_id].correct  += p.correct_total || 0
        byUser[p.user_id].sessions += p.sessions_played || 0
      })

      // Get display names from achievements table (we don't have names directly)
      // Fallback: show user_id shortened
      const topPlayers = Object.entries(byUser)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10)
        .map(([uid, d]) => ({ uid, ...d }))

      // Achievements unlocked
      const totalAchs = (achievements || []).length
      const achByType = {}
      ;(achievements || []).forEach(a => {
        achByType[a.achievement_id] = (achByType[a.achievement_id] || 0) + 1
      })
      const topAchs = Object.entries(achByType).sort((a,b) => b[1]-a[1]).slice(0,5)

      // Salas
      const totalRooms   = (rooms || []).length
      const totalPlays   = (roomResults || []).length
      const avgRoomPlays = totalRooms > 0 ? (totalPlays / totalRooms).toFixed(1) : 0

      setData({
        totalCorrect, totalSessions, totalXP, uniqueUsers,
        topUniverses, topPlayers, requests: requests || [],
        totalAchs, topAchs,
        totalRooms, totalPlays, avgRoomPlays,
        recentRooms: (rooms || []).slice(0, 5),
        roomResults: roomResults || [],
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Cargando stats…</div>
  if (!data)   return null

  const maxSessions = data.topUniverses[0]?.sessions || 1
  const maxXP       = data.topPlayers[0]?.xp || 1

  return (
    <>
      <Navbar user={user} />
      <main className="app-shell" style={{ paddingTop:'1.5rem' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--text)', marginBottom:2 }}>
            Admin · <span style={{ color:'var(--accent)' }}>DuoMity Geek</span>
          </h1>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Dashboard de estadísticas en tiempo real</p>
        </div>

        {/* ── Overview ── */}
        <Section title="Resumen general">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <StatCard icon="👥" label="Usuarios activos"      value={data.uniqueUsers}    color="var(--accent)" />
            <StatCard icon="🎮" label="Partidas jugadas"      value={data.totalSessions}  color="var(--blue)" />
            <StatCard icon="✅" label="Respuestas correctas"  value={data.totalCorrect.toLocaleString()} color="var(--green)" />
            <StatCard icon="⚡" label="XP total generado"     value={data.totalXP.toLocaleString()}     color="#9b8ec4" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <StatCard icon="🏅" label="Logros desbloqueados" value={data.totalAchs}     color="var(--accent)" />
            <StatCard icon="🌐" label="Salas creadas"        value={data.totalRooms}    color="var(--blue)" />
            <StatCard icon="▶️" label="Jugadas en salas"     value={data.totalPlays}    sub={`~${data.avgRoomPlays} por sala`} color="var(--green)" />
          </div>
        </Section>

        {/* ── Top universos ── */}
        <Section title="Universos más jugados">
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0.75rem 1rem' }}>
            {data.topUniverses.length === 0
              ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>Sin datos aún.</p>
              : data.topUniverses.map((u, i) => {
                  const meta = UNIVERSES.find(x => x.id === u.id)
                  return (
                    <BarRow
                      key={u.id}
                      icon={meta?.icon || '🎮'}
                      label={meta?.name || u.id}
                      value={`${u.sessions} partidas`}
                      max={maxSessions}
                      color={meta?.color || 'var(--accent)'}
                      sub={`${u.correct} correctas · ${u.users} jugadores únicos`}
                    />
                  )
                })
            }
          </div>
        </Section>

        {/* ── Top players ── */}
        <Section title="Top jugadores por XP">
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0.75rem 1rem' }}>
            {data.topPlayers.length === 0
              ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>Sin datos aún.</p>
              : data.topPlayers.map((p, i) => (
                  <BarRow
                    key={p.uid}
                    icon={['🥇','🥈','🥉'][i] || '🎮'}
                    label={`Usuario ${p.uid.slice(0,8)}…`}
                    value={`${p.xp} XP`}
                    max={maxXP}
                    color="var(--accent)"
                    sub={`${p.correct} correctas · ${p.sessions} partidas`}
                  />
                ))
            }
          </div>
          <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>
            * Los nombres de usuario no se guardan en DuoMity Geek por privacidad. Para ver nombres completos usá el SQL Editor de Supabase con JOIN a auth.users.
          </p>
        </Section>

        {/* ── Universe requests ── */}
        {data.requests.length > 0 && (
          <Section title="Universos pedidos por la comunidad">
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0.75rem 1rem' }}>
              {data.requests.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:16, width:24, textAlign:'center' }}>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
                  <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>{r.universe}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>
                    {r.votes} {r.votes === 1 ? 'voto' : 'votos'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Top logros ── */}
        {data.topAchs.length > 0 && (
          <Section title="Logros más desbloqueados">
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0.75rem 1rem' }}>
              {data.topAchs.map(([id, count], i) => (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, fontFamily:'monospace', color:'var(--text-dim)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{id}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>{count}×</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Salas recientes ── */}
        {data.recentRooms.length > 0 && (
          <Section title="Salas recientes">
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0.75rem 1rem' }}>
              {data.recentRooms.map(room => {
                const plays = data.roomResults.filter(r => r.room_id === room.id).length
                const best  = data.roomResults.filter(r => r.room_id === room.id).sort((a,b)=>b.score-a.score)[0]
                return (
                  <div key={room.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:18 }}>{room.universe_icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>
                        {room.universe_name} <span style={{ color:'var(--accent)', letterSpacing:1 }}>#{room.code}</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-dim)' }}>
                        por {room.creator_name} · {plays} jugadores
                        {best && ` · mejor: ${best.player_name} ${best.score}/${best.total}`}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-dim)', flexShrink:0 }}>
                      {new Date(room.created_at).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

      </main>
    </>
  )
}
