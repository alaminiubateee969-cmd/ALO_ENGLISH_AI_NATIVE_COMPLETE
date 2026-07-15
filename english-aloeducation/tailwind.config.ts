import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alo: {
          navy: "#0B1F3A",
          blue: "#0057B8",
          royal: "#0B63CE",
          orange: "#E8501A",
          soft: { blue: "#EEF6FF", orange: "#FFF7ED", gray: "#F8FAFC" },
          ink: "#111827",
          muted: "#4B5563",
          faint: "#6B7280",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        alo: "0 2px 4px rgba(11,31,58,0.04), 0 4px 12px rgba(11,31,58,0.06)",
        "alo-lg": "0 8px 16px rgba(11,31,58,0.06), 0 20px 40px rgba(11,31,58,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
