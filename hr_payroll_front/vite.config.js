// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import tailwindcss from "@tailwindcss/vite";
// // https://vite.dev/config/
// export default defineConfig({
//   theme:{
//     extend:{
//       colors:{
//         eyob:'#000000'
//       }
//     }
//   },
//   plugins: [
//     react(),tailwindcss()],
// })




















import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  theme: {
    extend: {
      colors: {
        eyob: '#000000',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});