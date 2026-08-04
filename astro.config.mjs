// @ts-check
import { defineConfig } from "astro/config";

// Static output (Astro's default). No integrations, no client framework —
// the built site ships zero framework JavaScript.
// `site` makes og:image URLs absolute — update it when the real domain
// (grasping-straws.com / graspingstraws.cards) goes live.
export default defineConfig({
  site: "https://grasping-straws.vercel.app",
  build: {
    // assetsInlineLimit below also governs stylesheet inlining ("auto" keys
    // off the same threshold), which would have inlined the 8 KB stylesheet
    // into all 51 pages and lost it as a cached, shared asset. The
    // stylesheet stays external, exactly as it was.
    inlineStylesheets: "never",
  },
  vite: {
    build: {
      // The draw script is the only JavaScript on the site and it is needed
      // for the first interaction, so it stays inlined rather than costing a
      // round trip. Astro inlines under Vite's asset limit, which defaults to
      // 4 KB — the script crossed that when the card became a real object.
      // Nothing else is bundled: fonts and the mark live in public/ and are
      // copied verbatim, so raising this cannot base64 them into the CSS.
      assetsInlineLimit: 16384,
    },
  },
});
