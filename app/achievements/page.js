'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { UNIVERSES, getUniverseById, getTierLabel } from '@/lib/universes'
import { GLOBAL_ACHIEVEMENTS } from '@/lib/achievements'

export default function AchievementsPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [user, setUser]       = useState(null)
  const [achs, setAchs]       = useState(new Set())
  const [progress, setProg]   = useState({})
  const [selUniv, setSelUniv] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: achData } = await supabase
        .from('duomity_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)
      setAchs(new Set((achData || []).map(a => a.achievement_id)))

      const { data: progData } = await supabase
        .from('duomity_progress')
        .select('*')
        .eq('user_id', user.id)
      const map = {}
      ;(progData || []).forEach(p => { map[p.universe_id] = p })
      setProg(map)

      const firstAvail = UNIVERSES.find(u => u.available)
      setSelUniv(firstAvail?.id || null)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Cargando logros…</div>

  const universe = getUniverseById(selUniv)
  const prog     = progress[selUniv] || {}
  const tier     = getTierLabel(universe, prog.correct_total || 0)

  const branches = [
    {
      key: 'speed', label: 'Velocidad', cls: 'speed',
      nodes: [
        { id: `${selUniv}_speed1`, name: universe?.achievements?.speed1?.name || '—', desc: universe?.achievements?.speed1?.desc || '', xp: '+10 XP' },
        { id: `${selUniv}_speed2`, name: universe?.achievements?.speed2?.name || '—', desc: universe?.achievements?.speed2?.desc || '', xp: '+20 XP' },
        { id: `${selUniv}_speed3`, name: universe?.achievements?.speed3?.name || '—', desc: universe?.achievements?.speed3?.desc || '', xp: '+50 XP' },
      ]
    },
    {
      key: 'acc', label: 'Precisión', cls: 'acc',
      nodes: [
        { id: `${selUniv}_acc1`, name: universe?.achievements?.acc1?.name || '—', desc: universe?.achievements?.acc1?.desc || '', xp: '+5 XP' },
        { id: `${selUniv}_acc2`, name: universe?.achievements?.acc2?.name || '—', desc: universe?.achievements?.acc2?.desc || '', xp: '+20 XP' },
        { id: `${selUniv}_acc3`, name: universe?.achievements?.acc3?.name || '—', desc: universe?.achievements?.acc3?.desc || '', xp: '+50 XP' },
        { id: `${selUniv}_acc4`, name: universe?.achievements?.acc4?.name || '—', desc: universe?.achievements?.acc4?.desc || '', xp: '+100 XP' },
      ]
    },
    {
      key: 'cumul', label: 'Acumulación', cls: 'cumul',
      nodes: (universe?.tiers || []).map((t, i) => ({
        id: `${selUniv}_cumul${i + 1}`,
        name: t.label,
        desc: `${t.min} respuestas correctas`,
        xp: ['+30 XP', '+60 XP', '+100 XP', '+200 XP', '+300 XP'][i] || '',
        unlocked: (prog.correct_total || 0) >= t.min && t.min > 0,
      }))
    },
    {
      key: 'duel', label: 'Modo Duelo', cls: 'duel',
      nodes: [
        { id: `${selUniv}_duel1`, name: universe?.achievements?.duel1?.name || '—', desc: universe?.achievements?.duel1?.desc || '', xp: '+15 XP' },
        { id: `${selUniv}_duel2`, name: universe?.achievements?.duel2?.name || '—', desc: universe?.achievements?.duel2?.desc || '', xp: '+40 XP' },
        { id: `${selUniv}_duel3`, name: universe?.achievements?.duel3?.name || '—', desc: universe?.achievements?.duel3?.desc || '', xp: '+80 XP' },
        { id: `${selUniv}_duel4`, name: universe?.achievements?.duel4?.name || '—', desc: universe?.achievements?.duel4?.desc || '', xp: '+150 XP' },
      ]
    },
  ]

  return (
    <>
      <Navbar user={user} />
      <main className="app-shell">

        <div className="page-top" style={{ paddingBottom: '1rem' }}>
          <button className="back-btn" onClick={() => router.push('/home')} style={{ margin: '0 auto 1rem' }}>←</button>
          <div className="page-title">Logros</div>
          <div className="page-sub">Tu progreso en el multiverso geek</div>
        </div>

        {/* Global achievements */}
        <div className="section-label">Globales</div>
        <div className="ach-global-grid" style={{ marginBottom: '1.5rem' }}>
          {GLOBAL_ACHIEVEMENTS.map(a => (
            <div key={a.id} className={`ach-badge${achs.has(a.id) ? ' earned' : ''}`}>
              <div className="ach-badge-icon">{a.icon}</div>
              <div className="ach-badge-name">{a.name}</div>
              <div className="ach-badge-desc">{a.desc}</div>
            </div>
          ))}
        </div>

        {/* Universe selector tabs */}
        <div className="section-label">Por universo</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {UNIVERSES.filter(u => u.available).map(u => (
            <button
              key={u.id}
              onClick={() => setSelUniv(u.id)}
              style={{
                background: selUniv === u.id ? u.colorSoft : 'var(--surface)',
                border: `1px solid ${selUniv === u.id ? u.colorBorder : 'var(--border)'}`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 500,
                color: selUniv === u.id ? u.color : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {u.icon} {u.name}
            </button>
          ))}
        </div>

        {/* Universe header: tier + stats */}
        {universe && (
          <div className="card" style={{ marginBottom: '1rem', borderColor: universe.colorBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{universe.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{universe.name}</div>
                <div style={{ fontSize: 12, color: universe.color }}>{tier}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: universe.color }}>{prog.correct_total || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correctas</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement tree branches */}
        <div className="ach-branches">
          {branches.map(branch => (
            <div key={branch.key} className="ach-branch">
              <div className={`ach-branch-header ${branch.cls}`}>
                <div className="ach-branch-label">{branch.label}</div>
              </div>
              {branch.nodes.map(node => {
                const earned = node.unlocked !== undefined ? node.unlocked : achs.has(node.id)
                return (
                  <div key={node.id} className={`ach-node ${earned ? `earned ${branch.cls}` : 'locked'}`}>
                    <div className="an-name">{node.name}</div>
                    <div className="an-desc">{node.desc}</div>
                    <div className="an-xp">{node.xp}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

      <Footer />
      </main>
    </>
  )
}
