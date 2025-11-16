import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching (T109)
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Monaco Editor into its own chunk (large dependency)
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          // Separate React Flow into its own chunk (visualization library)
          'react-flow': ['@xyflow/react'],
          // Separate TypeScript compiler into its own chunk (parsing)
          'typescript': ['typescript'],
          // Group React and related libraries
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          // Group Zustand and state management
          'state': ['zustand'],
        },
      },
    },
    // Increase chunk size warning limit (Monaco is large)
    chunkSizeWarningLimit: 1000,
  },
});
