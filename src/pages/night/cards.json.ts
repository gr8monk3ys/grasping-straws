/*
 * The Night edition's cards, as the draw script fetches them. Built at
 * deploy time into a static file. Drafts are left out, as they are from
 * everything else the site serves.
 */
import type { APIRoute } from "astro";
import { TABLES } from "../../deck/site";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(TABLES.night.cards), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
