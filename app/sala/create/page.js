'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UNIVERSES, CATEGORIES } from '@/lib/universes'
import { pickQuestions } from '@/lib/questionLoader'
import Navbar from '@/components/Navbar'

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function CreateSalaPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [user,    setUser]    = useState(null)
  const [univId,  setUnivId]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [sala,    setSala]    = useState(null)   // {code, url}
  const [selCat,  setSelCat]  = useState(null)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setUser(user)
    })
  }, [])

  const available = UNIVERSES.filter(u => u.available)
  const filtered  = selCat ? available.filter(u => u.categoryId === selCat) : available

  async function createSala() {
    if (!univId || loading) return
    setLoading(true)

    const universe = UNIVERSES.find(u => u.id === univId)
    const qs = pickQuestions(univId, 10).map(q => ({ q: q.q, o: q.o, a: q.a, exp: q.exp || '' }))

    let code
    let tries = 0
    while (tries < 5) {
      code = randomCode()
      const { data } = await supabase.from('duomity_rooms').select('code').eq('code', code).single()
      if (!data) break
      tries++
    }

    const { error } = await supabase.from('duomity_rooms').insert({
      code,
      universe_id:   universe.id,
      universe_name: universe.name,
      universe_icon: universe.icon,
      questions:     qs,
      created_by:    user.id,
      creator_name:  user.user_metadata?.full_name?.split(' ')[0] || 'Host',
    })

    setLoading(false)
    if (!error) {
      const url = `${window.location.origin}/sala/${code}`
      setSala({ code, url })
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(sala.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (sala) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(sala.url)}&bgcolor=16161f&color=f0ede8&margin=16`
    const universe = UNIVERSES.find(u => u.id === univId)
    return (
      <>
        <Navbar user={user} />
        <main className="app-shell" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{universe.icon}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--text)', marginBottom: 4 }}>
            Sala creada
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {universe.name} · 10 preguntas
          </p>

          {/* QR */}
          <div style={{ display: 'inline-block', background: '#16161f', borderRadius: 16, padding: 12, marginBottom: '1.25rem', border: '1px solid var(--border-md)' }}>
            <img src={qrUrl} alt="QR sala" width={220} height={220} style={{ display:'block', borderRadius:8 }} />
          </div>

          {/* Code */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'1rem', marginBottom:'1rem' }}>
            <div style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Código de sala</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:'var(--accent)', letterSpacing:8 }}>{sala.code}</div>
          </div>

          {/* Link */}
          <div style={{ display:'flex', gap:8, marginBottom:'1.5rem' }}>
            <div style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 12px', fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {sala.url}
            </div>
            <button onClick={copyLink} style={{ background:'var(--accent-soft)', border:'1px solid var(--accent-bd)', borderRadius:'var(--radius-sm)', padding:'10px 16px', fontSize:12, fontWeight:500, color:'var(--accent)', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          <p style={{ fontSize:12, color:'var(--text-dim)', marginBottom:'1.5rem', lineHeight:1.6 }}>
            Compartí el QR o el link. Cada amigo juega cuando quiera y sus resultados aparecen en el leaderboard de la sala. La sala expira en 7 días.
          </p>

          <button className="btn-secondary" onClick={() => router.push(`/sala/${sala.code}`)}>
            Ver leaderboard de la sala →
          </button>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar user={user} />
      <main className="app-shell">
        <div style={{ paddingTop:'1.5rem', marginBottom:'1.25rem' }}>
          <button className="back-btn" onClick={() => router.push('/home')}>←</button>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--text)', marginBottom:4 }}>
          Crear sala
        </h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:'1.5rem' }}>
          Elegí un universo — el sistema elige 10 preguntas fijas y genera un QR. Tus amigos escanean y juegan cuando quieran. Después se compara quién lo hizo mejor.
        </p>

        {/* Category filter */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
          <button onClick={() => { setSelCat(null); setUnivId(null) }}
            style={{ background: !selCat ? 'var(--accent-soft)' : 'var(--surface)', border:`1px solid ${!selCat ? 'var(--accent-bd)' : 'var(--border)'}`, borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:500, color: !selCat ? 'var(--accent)' : 'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
            Todos
          </button>
          {CATEGORIES.map(cat => {
            const active = selCat === cat.id
            const has = available.some(u => u.categoryId === cat.id)
            return (
              <button key={cat.id} onClick={() => { setSelCat(active ? null : cat.id); setUnivId(null) }}
                style={{ background: active ? 'var(--accent-soft)' : 'var(--surface)', border:`1px solid ${active ? 'var(--accent-bd)' : 'var(--border)'}`, borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:500, color: active ? 'var(--accent)' : has ? 'var(--text-muted)' : 'var(--text-dim)', cursor:'pointer', fontFamily:'inherit', opacity: has ? 1 : 0.5 }}>
                {cat.icon} {cat.name}
              </button>
            )
          })}
        </div>

        {/* Universe grid */}
        <div className="universe-grid" style={{ marginBottom:'1.5rem' }}>
          {filtered.map(u => {
            const isSelected = univId === u.id
            return (
              <div key={u.id} className="universe-card"
                style={{ '--uni': u.color, '--uni-soft': u.colorSoft, '--uni-bd': u.colorBorder, border: isSelected ? `2px solid ${u.color}` : '1px solid var(--border)', background: isSelected ? u.colorSoft : 'var(--surface)', transform: isSelected ? 'translateY(-2px)' : 'none', transition:'all .15s', cursor:'pointer' }}
                onClick={() => setUnivId(isSelected ? null : u.id)}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height: isSelected ? 4 : 2, background:u.color, borderRadius:'12px 12px 0 0', transition:'height .15s' }} />
                <span className="uc-icon">{u.icon}</span>
                <div className="uc-name" style={{ color: isSelected ? u.color : 'var(--text)', fontWeight: isSelected ? 600 : 500 }}>{u.name}</div>
                <div className="uc-sub">{u.sub}</div>
              </div>
            )
          })}
        </div>

        <button className="btn-primary" onClick={createSala} disabled={!univId || loading}>
          {loading ? 'Creando sala…' : '🌐 Crear sala y generar QR'}
        </button>
      </main>
    </>
  )
}
