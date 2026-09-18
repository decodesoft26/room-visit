import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  //   allowedDevOrigins: ["192.168.0.171"],
}

export default nextConfig
