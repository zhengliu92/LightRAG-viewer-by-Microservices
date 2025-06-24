import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            // max width for typography
            maxWidth: "100%",
            // min width for typography
            color: theme("colors.primary"),
            p: {
              fontSize: theme("fontSize.sm"), // Adjust the font size as needed
              // adjust margin for p tag
              margin: "0.2em",
              // text wrap
              // textIndent: "2em",
              whiteSpace: "pre-wrap",
            },
            // config for **
            strong: {
              color: theme("colors.primary"),
            },
            // change fontsize for ordered list
            ol: {
              fontSize: theme("fontSize.sm"),
              margin: "0em",
            },
            ul: {
              margin: "0em",
              fontSize: theme("fontSize.sm"),
            },

            h1: {
              color: theme("colors.primary"),
              fontSize: theme("fontSize.xl"), // Example for h1
            },
            h2: {
              color: theme("colors.primary"),
              fontSize: theme("fontSize.lg"), // Example for h2
            },
            h3: {
              color: theme("colors.primary"),
              fontSize: theme("fontSize.base"), // Example for h3
            },
            h4: {
              fontSize: theme("fontSize.sm"), // Example for h4
              color: theme("colors.primary"),
            },
            h5: {
              color: theme("colors.primary"),
              fontSize: theme("fontSize.xs"), // Example for h5
            },
            fontFamily: "var(--font-sans)",
            table: {
              width: "auto !important",
              marginTop: "1em",
              marginBottom: "1em",
              margin: "auto",
              borderCollapse: "collapse",
              backgroundColor: "rgb(249 250 251)", // Light gray background
            },
            "th, td": {
              padding: "0.5rem 1rem !important",
              border: "1px solid rgb(229 231 235) !important", // Light gray border
            },
            th: {
              backgroundColor: "rgb(243 244 246)", // Slightly darker gray for header
              verticalAlign: "middle",
              textAlign: "center",
              whiteSpace: "nowrap",
              fontWeight: "600",
            },
            td: {
              backgroundColor: "rgb(249 250 251)", // Light gray background
              verticalAlign: "middle",
              textAlign: "left", // Changed from justify for better readability
              whiteSpace: "normal",
              padding: "0.75rem 1rem !important", // Slightly more padding
            },
          },
        },
      }),
      fontFamily: {
        zentry: ["zentry", "sans-serif"],
        general: ["general", "sans-serif"],
        "circular-web": ["circular-web", "sans-serif"],
        "robert-medium": ["robert-medium", "sans-serif"],
        "robert-regular": ["robert-regular", "sans-serif"],
        "geist-sans": ["geist-sans", "sans-serif"],
        "geist-mono": ["geist-mono", "monospace"],
        "alibaba-light": ["alibaba-light", "sans-serif"],
        "alibaba-regular": ["alibaba-regular", "sans-serif"],
        "alibaba-medium": ["alibaba-medium", "sans-serif"],
        "alibaba-bold": ["alibaba-bold", "sans-serif"],
        "alibaba-heavy": ["alibaba-heavy", "sans-serif"],
        "alibaba-black": ["alibaba-black", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
