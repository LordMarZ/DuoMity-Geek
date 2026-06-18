export default function Footer() {
  const cuponera = process.env.NEXT_PUBLIC_CUPONERA_URL || 'https://darkside-cafe.vercel.app'
  const penca    = process.env.NEXT_PUBLIC_PENCA_URL    || 'https://darkside-penca.vercel.app'
  const quiz     = process.env.NEXT_PUBLIC_QUIZ_URL     || '#'
  const tienda   = 'https://darksidebros.com.uy'

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      marginTop: '2rem',
      padding: '2rem 1.25rem 1.5rem',
      maxWidth: 560,
      margin: '2rem auto 0',
    }}>

      {/* Logo + tagline */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img
          src="/logo-white.png"
          alt="Darkside Bros Café"
          style={{ height: 70, width: 'auto', display: 'block', margin: '0 auto 0.6rem', mixBlendMode: 'screen' }}
          onError={e => { e.target.src='/logo.png'; e.target.onerror=()=>e.target.style.display='none' }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '0.5rem' }}>
          Darkside Bros Café · Montevideo
        </div>
      </div>

      {/* Ecosystem apps */}


      {/* Info columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Contact */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
            Contacto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="https://www.google.com/maps/place/Darkside+Caf%C3%A9/@-34.9081428,-56.1932861,20.79z/data=!4m6!3m5!1s0x959f8188f5af85b3:0x433d39f0506a7607!8m2!3d-34.9080782!4d-56.193123!16s%2Fg%2F11jz7zb66q?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener"
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
              📍 Soriano 1062, Mvd
            </a>
            <a href="tel:+59829000220"
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
              📞 +598 2900 0220
            </a>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              🕐 Lun–Vie 9–20h · Sáb 10–19h
            </div>
          </div>
        </div>

        {/* Links */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
            Seguinos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="https://www.instagram.com/darksidebros/" target="_blank" rel="noopener"
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
              📸 @darksidebros
            </a>
            <a href="https://www.instagram.com/darksidebroscafe/" target="_blank" rel="noopener"
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
              ☕ @darksidebroscafe
            </a>
            <a href={tienda} target="_blank" rel="noopener"
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
              🛒 darksidebros.com.uy
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          © 2026 Darkside Bros Café — Montevideo, Uruguay
        </div>
      </div>

    </footer>
  )
}
