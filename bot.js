export default {
    async fetch(request, env) {
      const { BOT_TOKEN, D1 } = env;
  
      if (request.method === "POST") {
        try {
          const body = await request.json();
  
          if (body.message) {
            const chatId = body.message.chat.id;
            const text = body.message.text ? body.message.text.trim() : null;
  
            if (isValidUrl(text)) {
              // Guardar URL pendiente con un ID y enviar botones
              const id = await savePendingUrl(D1, chatId, text);
              await sendTelegramMessageWithButtons(BOT_TOKEN, chatId, `Wanna save this meme?`, id);
            } else {
              await sendTelegramMessage(BOT_TOKEN, chatId, "Please send a valid meme URL");
            }
          } else if (body.callback_query) {
            const chatId = body.callback_query.message.chat.id;
            const callbackData = body.callback_query.data;
  
            // Procesar la acción del botón
            const responseText = await handleCallbackQuery(D1, callbackData);
            await sendTelegramMessage(BOT_TOKEN, chatId, responseText);
          }
  
          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("ERROR: <fetch>", error);
          return new Response("Internal server error", { status: 500 });
        }
      }
  
      return new Response("Method not allowed", { status: 405 });
    },
  };
  
  // Función para enviar mensaje con botones
  async function sendTelegramMessageWithButtons(botToken, chatId, text, id) {
    const urlKeyboard = {
      inline_keyboard: [
        [
          { text: "Save", callback_data: `save:${id}` },
          { text: "Cancel", callback_data: `cancel:${id}` },
        ],
      ],
    };
  
    try {
      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          reply_markup: urlKeyboard,
        }),
      });
  
      const responseData = await response.json();
      console.log("Telegram response:", responseData);
  
      if (!response.ok) {
        console.error("ERROR: sending buttons", responseData);
      }
    } catch (error) {
      console.error("ERROR: <sendTelegramMessageWithButtons>", error);
    }
  }
  
  // Validar si un texto es una URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  function generateUUID() {
    const timestamp = Date.now().toString(16); // Timestamp único
    return `${timestamp}-xxxxxxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  // Guardar URL pendiente con un ID en la base de datos
  async function savePendingUrl(d1, chatId, url) {
    try {
      const id = generateUUID(); // Genera un identificador único
      const stmt = d1.prepare("INSERT OR REPLACE INTO pending_memes (id, chat_id, url) VALUES (?, ?, ?);");
      await stmt.bind(id, chatId, url).run();
      console.log("URL saved with ID:", id);
      return id; // Retorna el identificador
    } catch (error) {
      console.error("ERRRO: <savePendingUrl>", error);
      return null;
    }
  }
  
  // Manejar el callback_query
  async function handleCallbackQuery(d1, callbackData) {
    try {
      const [action, id] = callbackData.split(":");
  
      if (action === "save") {
        const url = await getUrlFromDatabase(d1, id);
        if (url) {
          // Guardar en la tabla definitiva
          await saveUrlToDatabase(d1, url);
          await deletePendingUrl(d1, id);
          return "Meme saved successfully";
        } else {
          return "ERROR: URL not found";
        }
      } else if (action === "cancel") {
        // Elimina la URL pendiente
        await deletePendingUrl(d1, id);
        return "Meme discarded";
      }
    } catch (error) {
      console.error("ERROR: handling callback_query", error);
      return "ERROR: <handleCallbackQuery>";
    }
  }
  
  // Obtener URL desde la base de datos usando el ID
  async function getUrlFromDatabase(d1, id) {
    try {
      const stmt = d1.prepare("SELECT url FROM pending_memes WHERE id = ?;");
      const result = await stmt.bind(id).first();
      return result ? result.url : null;
    } catch (error) {
      console.error("ERROR: <getUrlFromDatabase>", error);
      return null;
    }
  }
  
  // Eliminar URL pendiente desde la base de datos
  async function deletePendingUrl(d1, id) {
    try {
      const stmt = d1.prepare("DELETE FROM pending_memes WHERE id = ?;");
      await stmt.bind(id).run();
    } catch (error) {
      console.error("ERROR: <deletePendingUrl>", error);
    }
  }
  
  // Guardar URL definitiva en la base de datos
  async function saveUrlToDatabase(d1, url) {
    try {
      const stmt = d1.prepare("INSERT INTO meme_list (url, score) VALUES (?, 0);");
      await stmt.bind(url).run();
      return { success: true };
    } catch (error) {
      console.error("ERROR: <saveUrlToDatabase>", error);
      return { success: false };
    }
  }
  
  // Enviar mensaje simple de texto
  async function sendTelegramMessage(botToken, chatId, text) {
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  
    if (!response.ok) {
      console.error("EROR: <sendTelegramMessage>", await response.text());
    }
  }
  