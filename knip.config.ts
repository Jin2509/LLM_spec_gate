import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,error,loading,not-found,route}.{ts,tsx}",
  ],
  project: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
};

export default config;
