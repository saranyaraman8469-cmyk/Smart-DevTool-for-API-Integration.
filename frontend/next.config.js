/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to the FastAPI backend server-side.
  // The browser never talks directly to FastAPI — Next.js forwards requests internally.
  // This eliminates ALL CORS issues permanently.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      // All main API routes (api-docs, wrappers, chat, analytics, health)
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
      // Auth routes — mapped to /auth-api/* to avoid Next.js /api/* conflict
      {
        source: "/auth-api/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
