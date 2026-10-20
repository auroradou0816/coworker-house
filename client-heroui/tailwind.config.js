import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f1f5f9",
        ivory: "#f8fafc",
        sand: "#e2e8f0",
        warmBorder: "#dbe3ee",
        warmText: "#0b101b",
        warmMuted: "#526176",
        "muted-foreground": "rgb(var(--rt-muted-foreground-rgb) / <alpha-value>)",
        terracotta: "#0891b2",
        coral: "#67e8f9",
        ink: "#253247",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            /* 段落与标题更紧凑 */
            "p": {
              marginTop: theme("spacing.1"),
              marginBottom: theme("spacing.1"),
            },
            "h1,h2,h3,h4,h5,h6": {
              marginTop: theme("spacing.2"),
              marginBottom: theme("spacing.2"),
            },

            /* 代码块 (pre) */
            "pre": {
              backgroundColor: theme("colors.white"),
              borderRadius: theme("borderRadius.lg"),
              padding: theme("spacing.4"),
              marginTop: theme("spacing.10"),
              marginBottom: theme("spacing.10"),
              overflowX: "auto",
              minWidth: "0",
              maxWidth: "100%",
            },
            /* 行内 code */
            "code": {
              backgroundColor: theme("colors.gray.200"),
              padding: `${theme("spacing.0.5")} ${theme("spacing.1")}`,
              borderRadius: theme("borderRadius.md"),
              minWidth: "0",
              maxWidth: "100%",
            },
          },
        },
        dark: {
          css: {
            /* 深色模式下 pre 背景 */
            "pre": {
              backgroundColor: theme("colors.gray.800"),
            },
            /* 深色模式下 inline code 背景 */
            "code": {
              backgroundColor: theme("colors.gray.700"),
            },
          },
        },
      }),
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#f1f5f9",
            foreground: "#0b101b",
            content1: "#f8fafc",
            content2: "#eaf0f7",
            content3: "#e2e8f0",
            content4: "#cbd5e1",
            divider: "#dbe3ee",
            focus: "#3898ec",
            primary: {
              DEFAULT: "#253247",
              foreground: "#f8fafc",
            },
            secondary: {
              // Dark cyan keeps light-theme action labels readable.
              DEFAULT: "#0e7490",
              foreground: "#f8fafc",
            },
          },
        },
        dark: {
          colors: {
            background: "#0b101b",
            foreground: "#f8fafc",
            content1: "#101827",
            content2: "#253247",
            content3: "#334155",
            content4: "#475569",
            divider: "#253247",
            focus: "#3898ec",
            primary: {
              DEFAULT: "#f8fafc",
              foreground: "#0b101b",
            },
            secondary: {
              DEFAULT: "#67e8f9",
              foreground: "#0b101b",
            },
          },
        },
      },
      layout: {
        radius: {
          small: "6px",
          medium: "8px",
          large: "12px",
        },
      },
    }),
    require("@tailwindcss/typography"),
    // require('@tailwindcss/forms'),
    require("@tailwindcss/aspect-ratio"),
  ],
};
