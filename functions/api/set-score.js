async function setScore(id, score) {
    const apiUrl = import.meta.env.WORKER_API_URL || "/api/set-score"; // Usa variable de entorno o ruta relativa
  
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, score }),
      });
  
      if (!response.ok) {
        throw new Error("Error setting score: " + response.statusText);
      }
  
      console.log("Score updated successfully for meme ID:", id);
    } catch (error) {
      console.error("Error in setScore:", error);
    }
  }