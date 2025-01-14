export async function onRequest({ env }) {
    try {
      const stmt = env.D1.prepare("SELECT * FROM meme_list;");
      const results = await stmt.all();
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching memes:", error);
      return new Response("Error fetching memes", { status: 500 });
    }
  }