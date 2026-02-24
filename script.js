document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('start-game');
    const restartGameButton = document.getElementById('restart-game');
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultsText = document.getElementById('results-text');
    
    // Create progress tracking elements
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');
    progressContainer.style.cssText = 'width: 100%; margin-bottom: 20px; padding: 0 20px; box-sizing: border-box;';
    
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBar.style.cssText = 'width: 100%; height: 10px; background-color: #e0e0e0; border-radius: 5px; overflow: hidden;';
    
    const progressFill = document.createElement('div');
    progressFill.classList.add('progress-fill');
    progressFill.style.cssText = 'height: 100%; background-color: #4CAF50; width: 0%; transition: width 0.3s ease;';
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    const questionCounter = document.createElement('div');
    questionCounter.classList.add('question-counter');
    questionCounter.style.cssText = 'text-align: center; margin-top: 8px; font-size: 14px; color: #666; font-weight: 500;';
    progressContainer.appendChild(questionCounter);
    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.classList.add('next-button', 'hidden');

    const GAME_LENGTH = 12; // Number of questions per game
    const SEEN_QUESTIONS_KEY = 'seenQuestions';
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedQuestions = [];
    let intents = [];
    let questions = [];

    // Fetch intents and questions from JSON files
    Promise.all([
        fetch('data/intents.json').then((response) => response.json()),
        fetch('data/questions.json').then((response) => response.json())
    ]).then(([intentsData, questionsData]) => {
        intents = intentsData.intents;
        questions = questionsData.questions;
        prepareGame(questions);
    });

    function prepareGame(questions) {
        let seenQuestions = JSON.parse(localStorage.getItem(SEEN_QUESTIONS_KEY)) || [];

        // Separate seen and unseen questions
        let unseenQuestions = questions.filter((q) => !seenQuestions.includes(q.id));
        let seenQuestionsPool = questions.filter((q) => seenQuestions.includes(q.id));

        // Ensure at least 1 evil question per game
        const unseenEvilQuestions = unseenQuestions.filter((q) => q.isEvil);
        const unseenNonEvilQuestions = unseenQuestions.filter((q) => !q.isEvil);
        const seenEvilQuestions = seenQuestionsPool.filter((q) => q.isEvil);
        const seenNonEvilQuestions = seenQuestionsPool.filter((q) => !q.isEvil);

        let gameQuestions = [];

        // Add 1 unseen evil question if available, otherwise fallback to seen evil
        if (unseenEvilQuestions.length > 0) {
            gameQuestions.push(...getRandomQuestions(unseenEvilQuestions, 1));
        } else if (seenEvilQuestions.length > 0) {
            gameQuestions.push(...getRandomQuestions(seenEvilQuestions, 1));
        }

        // Strategy: 33% from seen questions (4 out of 12), 67% from unseen (8 out of 12)
        // This provides spaced repetition for learning until all questions are seen
        const remainingSlots = GAME_LENGTH - gameQuestions.length;
        const seenSlots = Math.max(0, Math.min(4 - 1, Math.ceil(remainingSlots * 0.33))); // ~33% from seen, but max 4 total
        const unseenSlots = remainingSlots - seenSlots;

        gameQuestions.push(...getRandomQuestions(unseenNonEvilQuestions, unseenSlots));
        gameQuestions.push(...getRandomQuestions(seenQuestionsPool, seenSlots));

        // If fewer than GAME_LENGTH questions were gathered, fill remaining with random from all available
        if (gameQuestions.length < GAME_LENGTH) {
            const allRemainingQuestions = questions.filter(
                (q) => !gameQuestions.some(gq => gq.id === q.id)
            );
            gameQuestions.push(...getRandomQuestions(allRemainingQuestions, GAME_LENGTH - gameQuestions.length));
        }

        // Shuffle the game questions
        gameQuestions = gameQuestions.sort(() => Math.random() - 0.5);
        selectedQuestions = gameQuestions;

        welcomeScreen.classList.remove('hidden');
    }

    function updateProgress() {
        if (selectedQuestions.length > 0) {
            const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
            progressFill.style.width = progress + '%';
            questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
        }
    }

    function initializeProgressUI() {
        // Insert progress container at the beginning of game screen if not already there
        if (!gameScreen.contains(progressContainer)) {
            gameScreen.insertBefore(progressContainer, gameScreen.firstChild);
        }
        progressFill.style.width = '0%';
        questionCounter.textContent = '';
    }

    function getRandomQuestions(questionPool, number) {
        const shuffled = questionPool.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, number);
    }

    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initializeProgressUI();
        showQuestion();
    }

    // Add event listeners to buttons
    startGameButton.addEventListener('click', startGame);
    restartGameButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        prepareGame(questions);
    });

    // Add next button functionality
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < selectedQuestions.length) {
            showQuestion();
        } else {
            endGame();
        }
    });

    // Add arrow key functionality
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' && !nextButton.classList.contains('hidden')) {
            currentQuestionIndex++;
            if (currentQuestionIndex < selectedQuestions.length) {
                showQuestion();
            } else {
                endGame();
            }
        }
    });

    function showQuestion() {
        updateProgress();
        const question = selectedQuestions[currentQuestionIndex];
        const shuffledOptions = getShuffledOptions(question);

        questionText.textContent = question.text;
        optionsContainer.innerHTML = '';
        nextButton.classList.add('hidden');

        shuffledOptions.forEach((option) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkAnswer(button, option));
            optionsContainer.appendChild(button);
        });

        if (!optionsContainer.contains(nextButton)) {
            optionsContainer.appendChild(nextButton);
        }

        if (question.isEvil) {
            questionText.setAttribute('data-evil-note', question.evilNote);
        }
    }

    function getShuffledOptions(question) {
        if (question.correct === "Not Feedback (Observation)") {
            return intents.filter((intent) => intent !== "Not Feedback (Observation)")
                .sort(() => Math.random() - 0.5)
                .slice(0, 6); // Just 6 options for observation question
        }

        const incorrectOptions = intents.filter((intent) => intent !== question.correct);
        const randomIncorrect = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 5);
        const allOptions = [...randomIncorrect, question.correct];
        return allOptions.sort(() => Math.random() - 0.5);
    }

    function checkAnswer(selectedButton, selectedOption) {
        const question = selectedQuestions[currentQuestionIndex];
        const correctAnswer = question.correct;
        const multipleCorrect = question.multipleCorrect || [];

        const allButtons = document.querySelectorAll('.option-button');
        allButtons.forEach((button) => {
            button.disabled = true;
            if (button.textContent === correctAnswer || multipleCorrect.includes(button.textContent)) {
                button.classList.add('correct');
            }
            if (button.textContent === selectedOption && ![correctAnswer, ...multipleCorrect].includes(selectedOption)) {
                button.classList.add('incorrect');
            }
        });

        const feedback = document.createElement('p');
        feedback.style.color = '#333';
        feedback.textContent =
            [correctAnswer, ...multipleCorrect].includes(selectedOption)
                ? `Correct! ${getExplanation(correctAnswer)}`
                : `Incorrect. The correct answer is "${correctAnswer}". ${getExplanation(correctAnswer)}`;

        optionsContainer.appendChild(feedback);

        if (question.isEvil) {
            addEvilNote(questionText.getAttribute('data-evil-note'));
        }

        if ([correctAnswer, ...multipleCorrect].includes(selectedOption)) {
            score++;
        }

        nextButton.classList.remove('hidden');
    }

    function addEvilNote(note) {
        const evilFeedback = document.createElement('div');
        evilFeedback.classList.add('evil-feedback');
        evilFeedback.textContent = `Pro-Tip: ${note}`;
        optionsContainer.appendChild(evilFeedback);
    }

    function endGame() {
        // Save answered questions to localStorage
        const seenQuestions = JSON.parse(localStorage.getItem(SEEN_QUESTIONS_KEY)) || [];
        const answeredQuestions = selectedQuestions.map((q) => q.id);
        localStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify([...new Set([...seenQuestions, ...answeredQuestions])]));

        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        resultsText.textContent = `You answered ${score} out of ${selectedQuestions.length} correctly.`;
    }

    function getExplanation(intent) {
        const explanations = {
            "Advice": "This offers guidance or suggestions to aid decision-making.",
            "Appreciation": "This expresses gratitude for someone's actions or contributions.",
            "Coaching": "This helps improve skills by providing specific guidance.",
            "Criticism": "This highlights a perceived shortcoming constructively.",
            "Encouragement": "This motivates someone and inspires confidence.",
            "Evaluation": "This assesses quality or value against a standard.",
            "Praise": "This acknowledges an achievement or quality positively.",
            "Psychological Evaluation": "This makes judgments about someone's character or emotions.",
            "Interpersonal Feedback": "This explains how someone's behavior impacts others.",
            "Not Feedback (Observation)": "This is a simple observation without feedback or judgment."
        };
        return explanations[intent] || "No explanation available.";
    }
});