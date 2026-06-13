/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite imagens de domínios externos (útil para fotos enviadas pelos clientes)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
}

module.exports = nextConfig
