export default {
  async fetch(request, env) {
    const { BOT_TOKEN, D1, CHAT_ID } = env;

    if (request.method === "POST") {
      try {
        const body = await request.json();

        if (body.message) {
          const chat_id    = body.message.chat.id;
          const user_id    = body.message.from.id;
          const username   = body.message.from.username || "No username";
          const first_name = body.message.from.first_name || "No first name";
          const last_name  = body.message.from.last_name || "No last name";

          // Verificar si el mensaje proviene del chat permitido
          if (chat_id.toString() !== CHAT_ID) {
            console.log(`Unauthorized access from User ID: ${user_id}, Username: ${username}, Name: ${first_name} ${last_name}`);
            await sendTelegramMessage(BOT_TOKEN, chat_id, "Unauthorized: your are not a MemeCast member");
            return new Response("Unauthorized", { status: 200 });
          }

          const text = body.message.text ? body.message.text.trim() : null;

          if (text === "/options") {
            // Enviar botones de opciones
            await sendOptionsButtons(BOT_TOKEN, chat_id);
          } else if (isValidUrl(text)) {
            // Guardar URL pendiente con un ID y enviar botones
            const id = await savePendingUrl(D1, chat_id, text);
            await sendConfirmMessageButtons(BOT_TOKEN, chat_id, "Wanna save this meme?", id);
          } else {
            await sendTelegramMessage(BOT_TOKEN, chat_id, "Please send a valid meme URL");
          }
        } else if (body.callback_query) {
          const chat_id = body.callback_query.message.chat.id;

          // Verificar si el mensaje proviene del chat permitido
          if (chat_id.toString() !== CHAT_ID) {
            console.log(`Unauthorized access from User ID: ${user_id}, Username: ${username}, Name: ${first_name} ${last_name}`);
            await sendTelegramMessage(BOT_TOKEN, chat_id, "Unauthorized: your are not a MemeCast member");
            return new Response("Unauthorized", { status: 200 });
          }

          const callbackData = body.callback_query.data;

          if (callbackData === "get_memes_db") {
            // Mostrar confirmación para eliminar
            const memes = await getMemes(D1);
            await sendMemeList(BOT_TOKEN, chat_id, memes);
          } else if (callbackData.startsWith("delete:")) {
            const meme_id = callbackData.split(":")[1];
            const success = await deleteMemeById(D1, meme_id);
            if (success) {
              await sendTelegramMessage(BOT_TOKEN, chat_id, `Meme with ID ${meme_id} deleted successfully`);
            } else {
              await sendTelegramMessage(BOT_TOKEN, chat_id, `Failed to delete meme with ID ${meme_id}`);
            }
          } else if (callbackData === "clear_memes_db") {
            // Mostrar confirmación para eliminar
            await sendClearMemesButtons(BOT_TOKEN, chat_id);
          } if (callbackData === "ok_clear") {
            // Confirmar eliminación
            await deleteDatabase(D1);
            await sendTelegramMessage(BOT_TOKEN, chat_id, "Database has been cleared");
          } else if (callbackData === "cancel_clear") {
            // Cancelar eliminación
            await sendTelegramMessage(BOT_TOKEN, chat_id, "Database deletion canceled");
          } else {
            // Procesar otras acciones del botón
            const response_text = await handleCallbackQuery(D1, callbackData);
            await sendTelegramMessage(BOT_TOKEN, chat_id, response_text);
          }
        }

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("ERROR: <fetch>", error);
        return new Response("Internal server error", { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 200 });
  },
};

// Enviar botones de opciones
async function sendOptionsButtons(bot_token, chat_id) {
  const optionsKeyboard = {
    inline_keyboard: [
      [
        { text: "Show Meme list", callback_data: "get_memes_db" },
        { text: "Clear Meme list", callback_data: "clear_memes_db" }
      ],
    ],
  };

  const apiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
  await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: "Choose an option:",
      reply_markup: optionsKeyboard,
    }),
  });
}

// Enviar botones de confirmación
async function sendClearMemesButtons(bot_token, chat_id) {
  const confirmKeyboard = {
    inline_keyboard: [
      [
        { text: "Ok", callback_data: "ok_clear" },
        { text: "Cancel", callback_data: "cancel_clear" }
      ],
    ],
  };

  const apiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
  await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: "Are you sure you want to delete the database?",
      reply_markup: confirmKeyboard,
    }),
  });
}

// Eliminar base de datos
async function getMemes(d1) {
  try {
    const stmt   = d1.prepare("SELECT id, url FROM meme_list;");
    const result = await stmt.all();
    return result.results || [];
  } catch (error) {
    console.error("ERROR: <getMemes>", error);
    return [];
  }
}

// Enviar lista de memes con botones de eliminación
async function sendMemeList(bot_token, chat_id, memes) {
  try {
    if (memes.length === 0) {
      await sendTelegramMessage(bot_token, chat_id, "Meme list is empty");
      return;
    }
    
    for (const meme of memes) {
      const delete_button = {
        inline_keyboard: [
          [{ text: "Delete", callback_data: `delete:${meme.id}` }],
        ],
      };

      const apiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text: `Meme URL: ${meme.url}`,
          reply_markup: delete_button,
        }),
      });
    }
  } catch (error) {
    console.error("ERROR: <sendMemeList>", error);
  }
}

// Manejar eliminación de memes individuales desde callback_query
async function deleteMemeById(d1, id) {
  try {
    const stmt = d1.prepare("DELETE FROM meme_list WHERE id = ?;");
    await stmt.bind(id).run();
    return true;
  } catch (error) {
    console.error("ERROR: <deleteMemeById>", error);
    return false;
  }
}

// Eliminar base de datos
async function deleteDatabase(d1) {
  try {
    await d1.prepare("DELETE FROM pending_memes").run();
    await d1.prepare("DELETE FROM meme_list").run();
    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("ERROR: <deleteDatabase>", error);
  }
}

// Función para enviar mensaje con botones
async function sendConfirmMessageButtons(bot_token, chat_id, text, id) {
  const urlKeyboard = {
    inline_keyboard: [
      [
        { text: "Save", callback_data: `save:${id}` },
        { text: "Cancel", callback_data: `cancel:${id}` },
      ],
    ],
  };

  try {
    const apiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
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
async function savePendingUrl(d1, chat_id, url) {
  try {
    const id = generateUUID(); // Genera un identificador único
    const stmt = d1.prepare("INSERT OR REPLACE INTO pending_memes (id, chat_id, url) VALUES (?, ?, ?);");
    await stmt.bind(id, chat_id, url).run();
    console.log("URL saved with ID:", id);
    return id;
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
async function sendTelegramMessage(bot_token, chat_id, text) {
  const apiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: text,
    }),
  });

  if (!response.ok) {
    console.error("ERROR: <sendTelegramMessage>", await response.text());
  }
}