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




















import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resolvedApiBaseUrl =
    (env.VITE_API_BASE_URL || env.VITE_BASE_URL || '').trim();

  return {
    // Force all legacy VITE_BASE_URL references to use VITE_API_BASE_URL.
    define: {
      'import.meta.env.VITE_BASE_URL': JSON.stringify(resolvedApiBaseUrl),
    },
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
  };
});