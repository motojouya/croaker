/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.NEXT_ORIGIN],
    },
  },
};
export default nextConfig;
