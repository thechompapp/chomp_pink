/** @type {import('tailwindcss').Config} */
// Assume necessary imports like `path` are already present if needed for aliases
import path from 'path'; // Make sure path is imported if using aliases

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Define a new color palette for the sleek black/grey theme
      colors: {
        // Background colors
        background: 'hsl(var(--background))', // Base background (e.g., almost black)
        foreground: 'hsl(var(--foreground))', // Base text color (e.g., off-white)
        card: 'hsl(var(--card))', // Card backgrounds (slightly lighter gray)
        'card-foreground': 'hsl(var(--card-foreground))', // Text on cards

        // Primary colors (for main actions, highlights) - Use a neutral/gray shade
        primary: 'hsl(var(--primary))', // e.g., a mid-gray
        'primary-foreground': 'hsl(var(--primary-foreground))', // Text on primary (e.g., white/black)

        // Secondary colors (for less prominent elements)
        secondary: 'hsl(var(--secondary))', // e.g., a darker gray
        'secondary-foreground': 'hsl(var(--secondary-foreground))', // Text on secondary

        // Accent colors (optional, for subtle highlights if needed)
        accent: 'hsl(var(--accent))', // e.g., a slightly different gray or even white/black
        'accent-foreground': 'hsl(var(--accent-foreground))',

        // Destructive colors (for delete actions, errors) - Keep red for clarity
        destructive: 'hsl(var(--destructive))', // e.g., red-600
        'destructive-foreground': 'hsl(var(--destructive-foreground))', // Text on destructive (e.g., white)

        // Muted colors (for borders, dividers, placeholder text)
        muted: 'hsl(var(--muted))', // e.g., a lighter gray
        'muted-foreground': 'hsl(var(--muted-foreground))', // Text color for muted elements (darker gray)

        // Border color
        border: 'hsl(var(--border))', // e.g., gray-700/800

        // Input field background/border
        input: 'hsl(var(--input))', // e.g., gray-600/700
      },
      borderRadius: { // Optional: adjust border radius for modern look
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      // Add custom animations for the ticker
      animation: {
        'scroll': 'scroll 60s linear infinite',
        'scroll-slow': 'scroll 90s linear infinite',
        'scroll-fast': 'scroll 30s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
      // You can also extend fonts, spacing, etc. here if needed
    },
  },
  plugins: [
     // Add shadcn/ui plugin if you are using it or plan to
     // require("tailwindcss-animate"), // Example if using animate plugin
  ],
  // Add resolve alias if not already present from previous configurations
  resolve: {
    alias: {
      '@': path.resolve(new URL('.', import.meta.url).pathname, './src'),
    },
  },
}