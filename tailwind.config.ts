import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Surfaces
        bg: {
          DEFAULT: "hsl(var(--bg))",
          raised: "hsl(var(--bg-raised))",
          sunken: "hsl(var(--bg-sunken))",
          overlay: "hsl(var(--bg-overlay))",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
          strong: "hsl(var(--border-strong))",
          muted: "hsl(var(--border-muted))",
        },
        text: {
          DEFAULT: "hsl(var(--text))",
          muted: "hsl(var(--text-muted))",
          subtle: "hsl(var(--text-subtle))",
          inverted: "hsl(var(--text-inverted))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          subtle: "hsl(var(--accent-subtle))",
          fg: "hsl(var(--accent-fg))",
        },
        gain: {
          DEFAULT: "hsl(var(--gain))",
          subtle: "hsl(var(--gain-subtle))",
          fg: "hsl(var(--gain-fg))",
        },
        loss: {
          DEFAULT: "hsl(var(--loss))",
          subtle: "hsl(var(--loss-subtle))",
          fg: "hsl(var(--loss-fg))",
        },
        warn: {
          DEFAULT: "hsl(var(--warn))",
          subtle: "hsl(var(--warn-subtle))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          subtle: "hsl(var(--info-subtle))",
        },
        // Politician party tints
        dem: "hsl(var(--dem))",
        rep: "hsl(var(--rep))",
        ind: "hsl(var(--ind))",
        // shadcn compat
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--text))",
        card: "hsl(var(--bg-raised))",
        "card-foreground": "hsl(var(--text))",
        popover: "hsl(var(--bg-overlay))",
        "popover-foreground": "hsl(var(--text))",
        primary: "hsl(var(--accent))",
        "primary-foreground": "hsl(var(--accent-fg))",
        secondary: "hsl(var(--bg-raised))",
        "secondary-foreground": "hsl(var(--text))",
        muted: "hsl(var(--bg-raised))",
        "muted-foreground": "hsl(var(--text-muted))",
        destructive: "hsl(var(--loss))",
        "destructive-foreground": "hsl(var(--loss-fg))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--accent))",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.02em" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["12px", { lineHeight: "18px" }],
        base: ["13px", { lineHeight: "20px" }],
        md: ["14px", { lineHeight: "22px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "26px" }],
        "2xl": ["22px", { lineHeight: "30px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
      },
      spacing: {
        header: "48px",
        strip: "32px",
        rail: "240px",
        railClosed: "56px",
        right: "320px",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        panel: "0 1px 0 0 hsl(var(--border)) inset",
        popover:
          "0 0 0 1px hsl(var(--border)), 0 12px 32px -8px hsl(0 0% 0% / 0.6)",
      },
      transitionDuration: {
        DEFAULT: "120ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 140ms ease-out",
        "slide-in-right": "slide-in-right 180ms ease-out",
        "slide-in-bottom": "slide-in-bottom 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
