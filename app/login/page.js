'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

function WeaponLogo() {
  return (
    <div style={{ position: 'relative', width: 120, height: 80, margin: '0 auto 0.5rem' }}>
      <style>{`
        @keyframes weaponCycle {
          0%, 28%    { opacity: 1; }
          33%, 61%   { opacity: 0; }
          66%, 94%   { opacity: 0; }
          100%       { opacity: 1; }
        }
        @keyframes weaponCycle2 {
          0%, 28%    { opacity: 0; }
          33%, 61%   { opacity: 1; }
          66%, 94%   { opacity: 0; }
          100%       { opacity: 0; }
        }
        @keyframes weaponCycle3 {
          0%, 28%    { opacity: 0; }
          33%, 61%   { opacity: 0; }
          66%, 94%   { opacity: 1; }
          100%       { opacity: 0; }
        }
        @keyframes glitchFlash {
          0%, 27%, 34%, 60%, 67%, 93%, 100% { opacity: 0; }
          29%, 31%  { opacity: 1; clip-path: inset(20% 0 50% 0); transform: translateX(-3px); }
          30%       { opacity: 0.7; clip-path: inset(50% 0 20% 0); transform: translateX(3px); }
          62%, 64%  { opacity: 1; clip-path: inset(10% 0 60% 0); transform: translateX(3px); }
          63%       { opacity: 0.7; clip-path: inset(60% 0 10% 0); transform: translateX(-3px); }
          95%, 97%  { opacity: 1; clip-path: inset(30% 0 40% 0); transform: translateX(-3px); }
          96%       { opacity: 0.7; clip-path: inset(40% 0 30% 0); transform: translateX(3px); }
        }
        .w-sabers { animation: weaponCycle  6s infinite; }
        .w-swords { animation: weaponCycle2 6s infinite; }
        .w-wands  { animation: weaponCycle3 6s infinite; }
        .w-glitch { animation: glitchFlash  6s infinite; position: absolute; inset: 0; }
      `}</style>

      {/* Lightsabers */}
      <svg className="w-sabers" viewBox="0 0 120 80" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        {/* Blue saber — top-left to bottom-right */}
        <defs>
          <filter id="glowBlue"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glowRed"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glowGold"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glowPurple"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Hilt blue */}
        <rect x="10" y="62" width="18" height="5" rx="2" fill="#888" />
        {/* Blade blue */}
        <line x1="19" y1="62" x2="95" y2="12" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" filter="url(#glowBlue)" />
        <line x1="19" y1="62" x2="95" y2="12" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        {/* Hilt red */}
        <rect x="92" y="62" width="18" height="5" rx="2" fill="#888" />
        {/* Blade red */}
        <line x1="101" y1="62" x2="25" y2="12" stroke="#FCA5A5" strokeWidth="3" strokeLinecap="round" filter="url(#glowRed)" />
        <line x1="101" y1="62" x2="25" y2="12" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        {/* Spark at cross */}
        <circle cx="60" cy="37" r="4" fill="white" opacity="0.9" filter="url(#glowBlue)" />
      </svg>

      {/* Sword & Axe */}
      <svg className="w-swords" viewBox="0 0 120 80" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        {/* Sword — top-left to bottom-right */}
        {/* Blade */}
        <polygon points="18,70 22,70 88,18 84,14" fill="#C0C0C0" filter="url(#glowGold)" />
        {/* Edge shine */}
        <line x1="19" y1="68" x2="87" y2="15" stroke="white" strokeWidth="0.8" opacity="0.6" />
        {/* Cross guard */}
        <rect x="14" y="60" width="14" height="4" rx="2" fill="#C8A96E" transform="rotate(-35, 21, 62)" />
        {/* Hilt */}
        <rect x="10" y="64" width="6" height="12" rx="2" fill="#8B6914" transform="rotate(-35, 13, 70)" />
        {/* Pommel */}
        <circle cx="8" cy="73" r="3" fill="#C8A96E" transform="rotate(-35, 8, 73)" />

        {/* Axe — top-right to bottom-left */}
        {/* Handle */}
        <line x1="100" y1="70" x2="30" y2="14" stroke="#8B6914" strokeWidth="5" strokeLinecap="round" />
        {/* Axe head */}
        <path d="M26,10 Q18,6 14,14 Q18,18 26,18 Z" fill="#C0C0C0" filter="url(#glowGold)" />
        <path d="M26,10 Q30,2 38,6 Q34,14 26,18 Z" fill="#A0A0A0" />
        {/* Shine on axe */}
        <line x1="18" y1="10" x2="24" y2="16" stroke="white" strokeWidth="0.8" opacity="0.5" />

        {/* Spark at cross */}
        <circle cx="60" cy="42" r="3" fill="#C8A96E" opacity="0.9" filter="url(#glowGold)" />
        <circle cx="60" cy="42" r="6" fill="#C8A96E" opacity="0.2" />
      </svg>

      {/* Harry Potter Wands */}
      <svg className="w-wands" viewBox="0 0 120 80" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        {/* Wand 1 — top-left to bottom-right */}
        <line x1="20" y1="68" x2="90" y2="14" stroke="#C4A265" strokeWidth="4" strokeLinecap="round" />
        <line x1="20" y1="68" x2="55" y2="41" stroke="#8B6914" strokeWidth="4" strokeLinecap="round" />
        {/* Tip glow wand 1 */}
        <circle cx="90" cy="14" r="5" fill="#A78BFA" opacity="0.9" filter="url(#glowPurple)" />
        <circle cx="90" cy="14" r="9" fill="#7C3AED" opacity="0.3" />
        {/* Sparkles wand 1 */}
        <line x1="90" y1="7" x2="90" y2="4" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="96" y1="10" x2="99" y2="8" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="97" y1="16" x2="100" y2="17" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Wand 2 — top-right to bottom-left */}
        <line x1="100" y1="68" x2="30" y2="14" stroke="#C4A265" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="68" x2="65" y2="41" stroke="#8B6914" strokeWidth="4" strokeLinecap="round" />
        {/* Tip glow wand 2 */}
        <circle cx="30" cy="14" r="5" fill="#FCA5A5" opacity="0.9" filter="url(#glowRed)" />
        <circle cx="30" cy="14" r="9" fill="#EF4444" opacity="0.3" />
        {/* Sparkles wand 2 */}
        <line x1="30" y1="7" x2="30" y2="4" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="24" y1="10" x2="21" y2="8" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="23" y1="16" x2="20" y2="17" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Clash spark */}
        <circle cx="60" cy="41" r="4" fill="white" opacity="0.95" filter="url(#glowPurple)" />
        <circle cx="60" cy="41" r="8" fill="#A78BFA" opacity="0.25" />
      </svg>

      {/* Glitch overlay */}
      <svg className="w-glitch" viewBox="0 0 120 80" style={{ width:'100%', height:'100%', opacity:0 }}>
        <rect width="120" height="80" fill="#A78BFA" opacity="0.15" />
        <rect x="0" y="20" width="120" height="8" fill="#7C3AED" opacity="0.3" />
        <rect x="0" y="50" width="120" height="5" fill="#F43F5E" opacity="0.2" />
      </svg>
    </div>
  )
}

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function signInWithGoogle() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      })
      if (error) {
        setError('Error al conectar con Google. Intentá de nuevo.')
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError('Error inesperado. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <img
        src="/logo-white.png"
        alt="Darkside Bros Café"
        className="login-logo"
        onError={e => e.target.style.display='none'}
      />

      <WeaponLogo />

      <h1 className="login-title">Duo<span>Mity</span></h1>
      <p className="login-sub">Trivia geek para dos jugadores</p>
      <p className="login-tagline">Darkside Bros Café · Montevideo</p>

      <button className="btn-google" onClick={signInWithGoogle} disabled={loading}>
        {loading ? (
          <span style={{ opacity: 0.7 }}>Conectando…</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </>
        )}
      </button>

      {error && (
        <p style={{ marginTop: '1rem', fontSize: '13px', color: 'var(--red)', maxWidth: '280px', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <p style={{ marginTop:'2rem', fontSize:'12px', color:'var(--text-dim)', maxWidth:'260px', lineHeight:1.5, textAlign:'center' }}>
        Al ingresar compartís tu progreso con el ecosistema Darkside Bros.
      </p>
    </div>
  )
}
