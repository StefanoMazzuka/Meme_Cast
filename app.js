const GAME_SCREEN         = document.getElementById('game_screen');
const MEME_CONTAINER      = document.getElementById('meme_container');
const MEME_ID             = document.getElementById('meme_id');
const MEME_BUTTON         = document.getElementById('meme_button');
const BACK_BUTTON         = document.getElementById('back_button');
const CENTER_GIF          = document.getElementById('center_gif');
const RATING_CONTAINER    = document.getElementById('rating_container');
const STARS               = Array.from(document.querySelectorAll('.star'));
const FINAL_SCREEN        = document.getElementById('final_screen');
const MEME_LIST_CONTAINER = document.getElementById('meme_list_container');
const RESTART_BUTTON      = document.getElementById('restart_button');

const SUCCESS_GIF = 'https://raw.githubusercontent.com/StefanoMazzuka/Meme_Cast/main/good_shot.gif';
const FAIL_GIF    = 'https://raw.githubusercontent.com/StefanoMazzuka/Meme_Cast/main/bad_shot.gif';
const WAITING_GIF = 'https://raw.githubusercontent.com/StefanoMazzuka/Meme_Cast/main/waiting.gif';

let memes        = new Map();
let meme_list    = [];
let current_meme = null;

async function getMemes() {
    try {
        const response = await fetch('/api/get-memes');
        if (!response.ok) throw new Error(`Error al obtener memes: ${response.statusText}`);

        const data = await response.json();
        memes.clear(); // Limpia el mapa antes de recargar
        data.forEach(item => {
            const { id, url, score } = item;
            memes.set(id, { url, score });
        });
    } catch (error) {
        console.error('ERROR: <getMemes>', error);
    }
}

function getNextMeme() {
    if (meme_list.length === 0) {
        return null;
    }
    const next_id = meme_list.shift();
    return { id: next_id, ...memes.get(next_id) };
}

function startGame() {
    GAME_SCREEN.style.display = 'flex';
    MEME_CONTAINER.style.display = 'none';
    FINAL_SCREEN.style.display = 'none';

    if (meme_list.length === 0) {
        showFinalScreen();
    } else {
        const interval = setInterval(() => {
            const success = Math.random() < 0.5;
            if (success) {
                CENTER_GIF.src = SUCCESS_GIF;
                clearInterval(interval);
                setTimeout(showNextMeme, 3000);
            } else {
                CENTER_GIF.src = FAIL_GIF;
            }
        }, 2000);
    }
}

function showNextMeme() {
    current_meme = getNextMeme();
    if (!current_meme) return;

    GAME_SCREEN.style.display = 'none';
    MEME_CONTAINER.style.display = 'flex';

    MEME_ID.textContent = `Meme ID: ${current_meme.id}`;
    MEME_BUTTON.onclick = () => {
        window.open(current_meme.url, '_blank');
    };

    resetRating();
}

BACK_BUTTON.addEventListener('click', () => {
    GAME_SCREEN.style.display    = 'flex'; // Muestra la pantalla del juego
    MEME_CONTAINER.style.display = 'none'; // Oculta el contenedor del meme actual

    startGame();
});

function resetRating() {
    STARS.forEach(star => star.classList.remove('selected'));
}

STARS.forEach(star => {
    star.addEventListener('click', async (event) => {
        const selectedScore = parseInt(event.target.dataset.score, 10);

        resetRating();
        for (let i = 0; i < selectedScore; i++) {
            STARS[i].classList.add('selected');
        }

        try {
            const response = await fetch('/api/set-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meme_id: current_meme.id,
                    score: selectedScore,
                }),
            });

            if (!response.ok) {
                throw new Error(`Error al guardar la puntuación: ${response.statusText}`);
            }

            current_meme.score = selectedScore;
        } catch (error) {
            console.error('Error al guardar la puntuación:', error);
        }
    });
});

async function showFinalScreen() {
    GAME_SCREEN.style.display    = 'none';
    MEME_CONTAINER.style.display = 'none';
    FINAL_SCREEN.style.display   = 'flex';

    await getMemes(); 

    MEME_LIST_CONTAINER.innerHTML = '';

    memes.forEach(({ url, score }, id) => {
        const memeItem = document.createElement('div');
        memeItem.className = 'meme-item';

        memeItem.innerHTML = `
            <div class="meme-info">
                <p>ID: ${id}</p>
                <a href="${url}" target="_blank">
                    <img src="https://raw.githubusercontent.com/StefanoMazzuka/Meme_Cast/main/meme_chest.gif" alt="Cofre">
                </a>
                <p>Puntuación: ${score || 0} <span class="score-star">★</span></p>
            </div>
        `;

        MEME_LIST_CONTAINER.appendChild(memeItem);
    });
}

RESTART_BUTTON.addEventListener('click', async () => {
    FINAL_SCREEN.style.display = 'none';
    await getMemes();
    meme_list = Array.from(memes.keys());
    CENTER_GIF.src = FAIL_GIF;
    startGame();
});

// Start game
window.onload = async () => {
    CENTER_GIF.src = FAIL_GIF;
    await getMemes();
    meme_list = Array.from(memes.keys());
    startGame();
};