/*
 * Hand-rolled sitemap — a build-time endpoint, zero integrations, in keeping
 * with the rest of the site. The /c/<id>/ share pages are the whole reason
 * this exists: 48 pages with the card text in their titles that nothing
 * links to except ephemeral shares, so without a sitemap a crawler has no
 * way to discover any of them.
 *
 * Drafts are ids reserved for the printed deck; they have no page and must
 * not be advertised. Same filter as getStaticPaths in c/[id].astro.
 */
import type { APIRoute } from "astro";
import cards from "../../public/cards.json";

export const GET: APIRoute = ({ site }) => {
  // `site` comes from astro.config.mjs; the build fails loudly rather than
  // emitting a sitemap full of relative URLs, which crawlers reject.
  if (!site) throw new Error("sitemap needs `site` set in astro.config.mjs");

  const urls = [
    "/",
    "/about/",
    ...cards.filter((c) => !("draft" in c && c.draft)).map((c) => `/c/${c.id}/`),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${new URL(u, site).href}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
