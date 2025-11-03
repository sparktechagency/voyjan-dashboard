import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
server:{
  host:"10.10.7.6",
},
preview: {
  allowedHosts:['shariful5001.binarybards.online']
}
})
