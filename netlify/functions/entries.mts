import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  try {
    const store = getStore("mitbringliste-merve");

    if (req.method === "GET") {
      const { blobs } = await store.list();
      const entries: { name: string; item: string; ts: number }[] = [];
      for (const b of blobs) {
        const data = await store.get(b.key, { type: "json" });
        if (data) entries.push(data);
      }
      entries.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      return new Response(JSON.stringify(entries), {
        headers: { "content-type": "application/json" },
      });
    }

    if (req.method === "POST") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Ungültige Anfrage." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const name = (body.name || "").toString().trim().slice(0, 60);
      const item = (body.item || "").toString().trim().slice(0, 120);

      if (!name || !item) {
        return new Response(
          JSON.stringify({ error: "Name und Mitbringsel dürfen nicht leer sein." }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      const entry = { name, item, ts: Date.now() };
      await store.setJSON(id, entry);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Serverfehler: " + (err && err.message ? err.message : String(err)) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/entries",
};
