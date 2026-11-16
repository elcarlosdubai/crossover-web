/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@whiskeysockets/baileys", "pino"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/courses-2", destination: "/instituto", permanent: true },
      { source: "/courses-2/:path*", destination: "/instituto", permanent: true },
      { source: "/courses", destination: "/instituto", permanent: true },
      { source: "/about", destination: "/nosotros", permanent: true },
      { source: "/about-us", destination: "/nosotros", permanent: true },
      { source: "/contact", destination: "/contacto", permanent: true },
      { source: "/contact-us", destination: "/contacto", permanent: true },
      { source: "/blog", destination: "/noticias", permanent: true },
    ];
  },
};

export default nextConfig;
