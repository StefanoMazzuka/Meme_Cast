async function setScore(id, newScore) {
    const apiUrl = import.meta.env.WORKER_API_URL || "/api";
  
    try {
      const response = await fetch(`${apiUrl}/set-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          score: newScore,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Error al actualizar el score");
      }
  
      console.log("Score actualizado correctamente");
    } catch (error) {
      console.error("Error:", error);
    }
  }