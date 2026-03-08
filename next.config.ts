import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // github pagesにデプロイするための設定
  output: "export",
  basePath: process.env.PAGES_BASE_PATH,
};

export default nextConfig;
