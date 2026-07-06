// @ts-check
import { defineConfig } from "astro/config";

// Static output (Astro's default). No integrations, no client framework —
// the built site ships zero framework JavaScript.
// `site` makes og:image URLs absolute — update it when the real domain
// (grasping-straws.com / graspingstraws.cards) goes live.
export default defineConfig({
  site: "https://grasping-straws.vercel.app",
});
