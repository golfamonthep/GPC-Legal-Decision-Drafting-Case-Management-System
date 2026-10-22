/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/d', destination: '/dashboard', permanent: false },
      { source: '/c', destination: '/cases', permanent: false },
      { source: '/c/:id', destination: '/cases/:id', permanent: false },
      { source: '/a', destination: '/analysis', permanent: false },
      { source: '/l', destination: '/library', permanent: false },
      { source: '/u', destination: '/registry/import', permanent: false },
      { source: '/upload', destination: '/registry/import', permanent: false },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'clsx', 'tailwind-merge'],
  },
};

export default nextConfig;
