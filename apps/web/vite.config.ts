import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadConfig } from "./src/config/env.js";

export default defineConfig(({ mode }) => {
  // La validacion tiene que ocurrir AQUI, no al evaluarse el modulo de
  // configuracion: eso ultimo pasa en el navegador, con la aplicacion ya
  // publicada. En una aplicacion de pagina unica los valores se incrustan al
  // construir, asi que este es el ultimo momento en que una variable ausente se
  // puede detectar antes de convertirse en una pantalla rota para el usuario.
  loadConfig(loadEnv(mode, process.cwd(), "VITE_"));

  return {
    plugins: [react(), tailwindcss()],

    server: {
      // El CORS de la API autoriza exactamente este origen. strictPort evita que
      // Vite salte en silencio al 5174 si el puerto esta ocupado y el navegador
      // empiece a recibir errores de CORS sin causa aparente.
      port: 5173,
      strictPort: true,
    },
  };
});
