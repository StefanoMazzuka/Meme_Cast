const GAME_SCREEN      = document.getElementById('game_screen');
const IFRAME_CONTAINER = document.getElementById('iframe_container');
const IFRAME           = document.getElementById('iframe');
const BACK_BUTTON      = document.getElementById('back_button');
const CENTER_GIF       = document.getElementById('center_gif');

const EMPTY_LIST_GIF = 'empty_list.gif';
const SUCCESS_GIF    = 'good_shot.gif';
const FAIL_GIF       = 'bad_shot.gif';

let meme_list = [];

async function getMemes() {
    try {
      const response = await fetch('/api/memes'); // Endpoint del Worker
      if (!response.ok) {
        console.log("Error fetching memes");
        throw new Error("Error fetching memes");
      }
      const memes = await response.json();
      console.log("Memes:", memes);
      return memes;
    } catch (error) {
      console.log(error);
    }
}

async function fetchData() {
    const apiUrl = import.meta.env.MEME_CAST_BD_API_URL;
  
    if (!apiUrl) {
      console.error("La variable MEME_CAST_BD_API_URL no está configurada.");
      return null;
    }
  
    try {
      const response = await fetch(`${apiUrl}/api/get-memes`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Datos recibidos:", data);
      return data;
    } catch (error) {
      console.error("Error al hacer la solicitud:", error);
      return null;
    }
  }

function getNextMeme() {
    if (meme_list.length === 0) {
        alert('No quedan más Memes.');
        return null;
    }
    return meme_list.shift();
}

function startGame() {
    GAME_SCREEN.style.display = 'flex';
    IFRAME_CONTAINER.style.display = 'none';

    if(meme_list.length === 0) {
        CENTER_GIF.src = EMPTY_LIST_GIF;
    } else {
        const interval = setInterval(() => {
            const success = Math.random() < 0.1;
            if (success) {
                CENTER_GIF.src = SUCCESS_GIF; 
                clearInterval(interval);
                setTimeout(loadIframe, 3000);
            } else {
                CENTER_GIF.src = FAIL_GIF;
            }
        }, 2000);
    }
}

function loadIframe() {
    const nextURL = getNextMeme();
    if (!nextURL) return;
    GAME_SCREEN.style.display = 'none';
    IFRAME_CONTAINER.style.display = 'flex';
    IFRAME.src = nextURL;
}

BACK_BUTTON.addEventListener('click', () => {
    IFRAME.src = '';
    CENTER_GIF.src = '';
    GAME_SCREEN.style.display = 'flex';
    IFRAME_CONTAINER.style.display = 'none';
    
    startGame();
});

// Start game
window.onload = async () => {
    CENTER_GIF.src = FAIL_GIF;
    //await loadURLs();
    const memes = await fetchData();
    console.log("Loaded memes:", memes);
    //startGame();
};
