export async function onRequest({ request, env }) {
    try {
      const { id, score } = await request.json();
  
      if (!id || typeof score !== "number") {
        return new Response("Invalid ID or score", { status: 400 });
      }
  
      const stmt = env.D1.prepare("UPDATE meme_list SET score = ? WHERE id = ?;");
      await stmt.bind(score, id).run();
  
      return new Response("Score updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error updating score:", error);
      return new Response("Error updating score", { status: 500 });
    }
  }