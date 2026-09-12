import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Lets next/image optimize (resize/compress/serve modern formats for)
    // product/category/banner/review photos uploaded to Supabase Storage,
    // whatever project this is pointed at -- those URLs always live under
    // <project-ref>.supabase.co. Locally-stored uploads (no Supabase
    // connected) are served from this same app under /api/uploads/*, which
    // is same-origin and needs no entry here.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
