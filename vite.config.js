import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'mchd55164',      
      'localhost',
      '127.0.0.1'
    ]
  //  allowedHosts: 'all'   // 允许所有主机名
  }
})
