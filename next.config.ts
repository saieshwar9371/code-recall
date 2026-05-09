import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Pin Turbopack to this app folder. If a lockfile exists in a parent directory (e.g. C:\Users\...)
// Next can mis-detect the workspace root and break dev on Windows (ENOENT on _buildManifest.js.tmp.*).
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  serverExternalPackages: ['child_process', 'fs', 'path', 'os'],
};

export default nextConfig;
