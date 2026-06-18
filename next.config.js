/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que el build falle por páginas que usan Supabase/auth en client side
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}
module.exports = nextConfig
