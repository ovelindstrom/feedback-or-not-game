document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('start-game');
    const restartGameButton = document.getElementById('restart-game');
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');

    // Start Game Logic
    startGameButton.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    });

    // Restart Game Logic
    restartGameButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
    });

    function startGame() {
        // Placeholder for starting the game loop, loading questions, etc.
        console.log('Game has started!');
    }
});