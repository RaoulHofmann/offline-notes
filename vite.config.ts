import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"
import { defineConfig, type Plugin } from "vite"

function crossOriginIsolation(): Plugin {
  return {
    name: "cross-origin-isolation",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        res.setHeader("Cross-Origin-Embedder-Policy", "credentialless")
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        res.setHeader("Cross-Origin-Embedder-Policy", "credentialless")
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), crossOriginIsolation()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
})
