/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  // Optional soft dependencies — not bundled; resolved at runtime if installed.
  serverExternalPackages: ['ioredis', 'amqplib'],
};

export default nextConfig;
