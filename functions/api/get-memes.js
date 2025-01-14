async function getMemes() {
    // Recuperar la ruta desde las variables de entorno
    const apiUrl = import.meta.env.WORKER_API_URL || "/api/get-memes";
  
    try {
      const response = await fetch(`${apiUrl}/api/get-memes`);
      if (!response.ok) {
        throw new Error("Error al cargar los memes");
      }
      const memes = await response.json();
      meme_list = memes.map(meme => meme.url); // Asignar URLs a meme_list
      console.log("Memes cargados:", meme_list);
    } catch (error) {
      console.error("Error:", error);
    }
  }
  