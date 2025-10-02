import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = env.VITE_API_TARGET || 'http://127.0.0.1:5000'
  const WS_TARGET  = env.VITE_WS_TARGET  || 'ws://127.0.0.1:5000'
  const HMR_HOST   = env.VITE_HMR_HOST   || undefined

  return defineConfig({
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      hmr: HMR_HOST ? { host: HMR_HOST, port: 3000, clientPort: 3000, protocol: 'ws' } : true,
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/ws': {
          target: WS_TARGET,
          changeOrigin: true,
          ws: true,          
          secure: false,      
        },
      },
    },
  })
}
