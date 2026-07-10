'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import styles from './Navbar.module.css'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

const MAPS_URL = "https://www.google.com/maps/place/Darkside+Caf%C3%A9/@-34.9081428,-56.1932861,20.79z/data=!4m6!3m5!1s0x959f8188f5af85b3:0x433d39f0506a7607!8m2!3d-34.9080782!4d-56.193123!16s%2Fg%2F11jz7zb66q?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D"

export default function Navbar({ user }) {
  const router   = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const cuponera = process.env.NEXT_PUBLIC_CUPONERA_URL || 'https://darkside-cafe.vercel.app/tarjeta'
  const menu     = process.env.NEXT_PUBLIC_MENU_URL     || 'https://darkside-cafe.vercel.app/menu'
  const penca    = process.env.NEXT_PUBLIC_PENCA_URL    || 'https://darkside-penca.vercel.app'
  const quiz     = process.env.NEXT_PUBLIC_QUIZ_URL     || '#'
  const tienda   = 'https://darksidebros.com.uy'

  const APPS = [
    { id: 'cuponera',  icon: '☕', label: 'CUPONERA',     sub: 'Fidelidad & sellos',  href: cuponera },
    { id: 'menu',      icon: '🍽️', label: 'MENÚ',         sub: 'Dulces, salados y café', href: menu },
    { id: 'penca',     icon: '⚽', label: 'PENCA',        sub: 'Pronósticos 2026',    href: penca },
    { id: 'duomity',   icon: '🎯', label: 'DUOMITY',      sub: 'Torneos & trivias',   href: quiz },
    { id: 'duomityg',  icon: '☠️', label: 'DUOMITY GEEK', sub: 'Quiz por universos',  href: null },
    { id: 'tienda',    icon: '🛒', label: 'TIENDA',       sub: 'darksidebros.com.uy', href: tienda },
  ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <nav className={styles.nav}>
        {/* Logo */}
        <div className={styles.logo}>
          <img
            src="/logo-white.png"
            alt="Darkside Bros"
            className={styles.logoImg}
            onError={e => { e.target.src='/logo.png'; e.target.onerror=()=>e.target.style.display='none' }}
          />
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>
              Duo<span>Mity</span>
            </span>
            <span className={styles.logoSub}>Geek Edition</span>
          </div>
        </div>

        {/* Right */}
        <div className={styles.right}>
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className={styles.avatar}
            />
          )}
          <button
            className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            title="Darkside Universe"
          >
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.dropTitle}>🌌 Darkside Universe</div>
            <div className={styles.dropApps}>
              {APPS.map(app => (
                app.href ? (
                  <a
                    key={app.id}
                    href={app.href}
                    className={styles.dropApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={styles.dropIcon}>{app.icon}</span>
                    <div>
                      <div className={styles.dropLabel}>{app.label}</div>
                      <div className={styles.dropSub}>{app.sub}</div>
                    </div>
                    <span className={styles.dropArrow}>→</span>
                  </a>
                ) : (
                  <div key={app.id} className={`${styles.dropApp} ${styles.dropActive}`}>
                    <span className={styles.dropIcon}>{app.icon}</span>
                    <div>
                      <div className={styles.dropLabel}>{app.label}</div>
                      <div className={styles.dropSub}>{app.sub}</div>
                    </div>
                    <span className={styles.dropCurrent}>AQUÍ</span>
                  </div>
                )
              ))}
            </div>

            <hr className={styles.dropDivider} />
            <div className={styles.dropInfo}>
              <a href={MAPS_URL} target="_blank" rel="noopener" className={styles.dropInfoLink}>
                📍 Soriano 1062, Montevideo
              </a>
              <a href="https://www.instagram.com/darksidebroscafe/" target="_blank" rel="noopener" className={styles.dropInfoLink}>
                ☕ @darksidebroscafe
              </a>
            </div>

            {user && ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email?.toLowerCase()) && (
              <a href="/admin" className={styles.dropInfoLink} onClick={() => setMenuOpen(false)}
                style={{ display:'block', fontSize:11, padding:'3px 4px', color:'var(--accent)', marginBottom:4 }}>
                ⚙️ Admin — ver estadísticas
              </a>
            )}
            {user && (
              <button className={styles.dropLogout} onClick={signOut}>
                Cerrar sesión
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
