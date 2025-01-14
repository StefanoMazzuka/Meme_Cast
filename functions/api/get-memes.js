async function getMemes() {
    const apiUrl = import.meta.env.WORKER_API_URL || "/api/get-memes"; // Usa variable de entorno o ruta relativa
  
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error("Error fetching memes: " + response.statusText);
      }
  
      const memes = await response.json();
      console.log("Memes retrieved:", memes);
      return memes; // Retorna los memes como un array
    } catch (error) {
      console.error("Error in getMemes:", error);
      return [];
    }
  }