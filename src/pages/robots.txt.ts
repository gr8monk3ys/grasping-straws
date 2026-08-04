/*
 * An endpoint rather than a static file for one reason: the Sitemap line
 * needs an absolute URL, and a hardcoded one goes silently stale the day the
 * real domain replaces vercel.app. Deriving it from `site` means the README's
 * "update astro.config.mjs when the domain goes live" step fixes this file
 * for free.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("robots.txt needs `site` set in astro.config.mjs");
  const body =
    `# Grasping Straws? — everything public is crawlable.\n` +
    `User-agent: *\n` +
    `Allow: /\n\n` +
    `Sitemap: ${new URL("/sitemap.xml", site).href}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
