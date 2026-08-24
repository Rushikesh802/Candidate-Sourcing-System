/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    let apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
    if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
      apiBase = `https://${apiBase}`;
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: '/health',
        destination: `${apiBase}/health`,
      },
      {
        source: '/docs',
        destination: `${apiBase}/docs`,
      },
      {
        source: '/openapi.json',
        destination: `${apiBase}/api/v1/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
