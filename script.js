const GAME_SCREEN      = document.getElementById('game_screen');
const IFRAME_CONTAINER = document.getElementById('iframe_container');
const IFRAME           = document.getElementById('iframe');
const BACK_BUTTON      = document.getElementById('back_button');
const CENTER_GIF       = document.getElementById('center_gif');

const EMPTY_LIST_GIF = 'empty_list.gif';
const SUCCESS_GIF    = 'good_shot.gif';
const FAIL_GIF       = 'bad_shot.gif';

let meme_list = [];

async function loadURLs() {
    try {
        const response = await fetch('memes');
        const text     = await response.text();

        meme_list = text.split('\n').filter(url => url.trim() !== '');
    } catch (error) {
        console.error('ERROR: <loadURLs>', error);
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
    await loadURLs();
    startGame();
};
