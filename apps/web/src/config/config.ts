import { loadConfig } from "./env.js";

// The SAME validation also runs at build time from vite.config.ts: that is what
// stops publishing a bundle pointing nowhere.
export const config = loadConfig();
