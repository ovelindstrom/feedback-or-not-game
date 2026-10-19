document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('start-game');
    const restartGameButton = document.getElementById('restart-game');
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');

    const questionText = document.getElementById('question-text');
    const questionFigure = document.getElementById('question-figure');
    const questionImage = document.getElementById('question-image');
    const optionsContainer = document.getElementById('options-container');
    const answerFeedback = document.getElementById('answer-feedback');
    const resultsText = document.getElementById('results-text');
    const resultsNarrative = document.getElementById('results-narrative');
    const resultsReport = document.getElementById('results-report');
    
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
    const ATTEMPT_HISTORY_KEY = 'feedbackAttemptHistory';
    let currentQuestionIndex = 0;
    let score = 0;
    let roundAttempts = [];
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
        roundAttempts = [];
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        document.body.classList.add('playing');
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
        if (question.image) {
            questionImage.src = question.image;
            questionImage.alt = question.imageAlt || 'Cartoon illustration for this question';
            questionFigure.classList.remove('hidden');
        } else {
            questionImage.removeAttribute('src');
            questionImage.alt = '';
            questionFigure.classList.add('hidden');
        }
        optionsContainer.innerHTML = '';
        answerFeedback.innerHTML = '';
        nextButton.classList.add('hidden');

        shuffledOptions.forEach((option) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkAnswer(button, option));
            optionsContainer.appendChild(button);
        });

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

        const accepted = [question.correct, ...(question.multipleCorrect || [])];
        const incorrectOptions = intents.filter((intent) => !accepted.includes(intent));
        const randomIncorrect = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, Math.max(0, 6 - accepted.length));
        return [...randomIncorrect, ...accepted].sort(() => Math.random() - 0.5);
    }

    function acceptedAnswers(question) {
        return [question.correct, ...(question.multipleCorrect || [])];
    }

    function formatAnswerList(answers) {
        if (answers.length === 1) return answers[0];
        if (answers.length === 2) return `${answers[0]} and ${answers[1]}`;
        return `${answers.slice(0, -1).join(', ')}, and ${answers[answers.length - 1]}`;
    }

    function checkAnswer(selectedButton, selectedOption) {
        const question = selectedQuestions[currentQuestionIndex];
        const correctAnswer = question.correct;
        const multipleCorrect = question.multipleCorrect || [];
        const acceptedAnswersForQuestion = acceptedAnswers(question);

        const allButtons = document.querySelectorAll('.option-button');
        allButtons.forEach((button) => {
            button.disabled = true;
            if (acceptedAnswersForQuestion.includes(button.textContent)) {
                button.classList.add('correct');
            }
            if (button.textContent === selectedOption && !acceptedAnswersForQuestion.includes(selectedOption)) {
                button.classList.add('incorrect');
            }
        });

        const accepted = acceptedAnswersForQuestion.includes(selectedOption);
        const verdict = document.createElement('p');
        verdict.className = accepted ? 'verdict verdict-correct' : 'verdict verdict-incorrect';
        verdict.textContent = accepted ? 'Correct' : 'Incorrect';

        const feedback = document.createElement('p');
        feedback.className = 'answer-note';
        const alsoAccepted = multipleCorrect.length
            ? ` More than one reading counts here: ${formatAnswerList(acceptedAnswersForQuestion)}.`
            : '';
        feedback.textContent = `${accepted
            ? getExplanation(correctAnswer)
            : `The best reading is "${correctAnswer}". ${getExplanation(correctAnswer)}`}${alsoAccepted}`;

        answerFeedback.replaceChildren(verdict, feedback, nextButton);

        if (question.isEvil) {
            addEvilNote(questionText.getAttribute('data-evil-note'));
        }

        roundAttempts.push({
            correct: correctAnswer,
            selected: selectedOption,
            accepted,
            isEvil: Boolean(question.isEvil)
        });
        if (accepted) {
            score++;
        }

        nextButton.classList.remove('hidden');
    }

    function addEvilNote(note) {
        const evilFeedback = document.createElement('div');
        evilFeedback.classList.add('evil-feedback');
        evilFeedback.textContent = `Pro-Tip: ${note}`;
        answerFeedback.appendChild(evilFeedback);
    }

    function endGame() {
        // Save answered questions to localStorage
        const seenQuestions = JSON.parse(localStorage.getItem(SEEN_QUESTIONS_KEY)) || [];
        const answeredQuestions = selectedQuestions.map((q) => q.id);
        localStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify([...new Set([...seenQuestions, ...answeredQuestions])]));

        const history = loadAttemptHistory();
        history.push(...roundAttempts);
        localStorage.setItem(ATTEMPT_HISTORY_KEY, JSON.stringify(history.slice(-240)));

        gameScreen.classList.add('hidden');
        document.body.classList.remove('playing');
        resultsScreen.classList.remove('hidden');
        resultsText.textContent = `You answered ${score} out of ${selectedQuestions.length} correctly.`;
        renderFeedbackReport(roundAttempts, history);
    }

    function loadAttemptHistory() {
        try {
            const stored = JSON.parse(localStorage.getItem(ATTEMPT_HISTORY_KEY)) || [];
            return stored.filter((attempt) => attempt && attempt.correct && attempt.selected);
        } catch (error) {
            return [];
        }
    }

    function renderFeedbackReport(attempts, history) {
        const byIntent = summarizeByIntent(attempts);
        const confusions = summarizeConfusions(attempts);
        const prior = history.slice(0, -attempts.length);
        const evil = attempts.filter((attempt) => attempt.isEvil);
        const evilMissed = evil.filter((attempt) => !attempt.accepted).length;

        resultsNarrative.textContent = buildNarrative(byIntent, confusions, evil, evilMissed, prior);
        resultsReport.innerHTML = '';
        resultsReport.append(
            buildIntentList(byIntent),
            buildConfusionList(confusions),
            buildCandorNote(evil, evilMissed),
            buildHistoryNote(history, prior)
        );
    }

    function summarizeByIntent(attempts) {
        const summary = new Map();
        attempts.forEach((attempt) => {
            const row = summary.get(attempt.correct) || { intent: attempt.correct, seen: 0, hit: 0 };
            row.seen += 1;
            if (attempt.accepted) {
                row.hit += 1;
            }
            summary.set(attempt.correct, row);
        });
        return [...summary.values()].sort((a, b) => (a.hit / a.seen) - (b.hit / b.seen) || b.seen - a.seen);
    }

    function summarizeConfusions(attempts) {
        const counts = new Map();
        attempts.filter((attempt) => !attempt.accepted).forEach((attempt) => {
            const key = `${attempt.correct}→${attempt.selected}`;
            const row = counts.get(key) || { from: attempt.correct, to: attempt.selected, count: 0 };
            row.count += 1;
            counts.set(key, row);
        });
        return [...counts.values()].sort((a, b) => b.count - a.count);
    }

    function buildNarrative(byIntent, confusions, evil, evilMissed, prior) {
        if (!byIntent.length) {
            return 'No answers were recorded this round.';
        }
        const sharp = byIntent.filter((row) => row.hit === row.seen);
        const soft = byIntent.filter((row) => row.hit < row.seen);
        const parts = [];
        if (sharp.length) {
            parts.push(`You read ${listIntents(sharp.map((row) => row.intent))} cleanly.`);
        }
        if (soft.length) {
            parts.push(`${listIntents(soft.map((row) => row.intent))} still slipped.`);
        }
        if (confusions[0]) {
            parts.push(`The mix-up to practice: ${confusions[0].from} read as ${confusions[0].to}.`);
        }
        if (evil.length) {
            parts.push(evilMissed
                ? `${evilMissed} of ${evil.length} problematic lines got past you. Spotting the intent is not the same as spotting the harm.`
                : `You also caught the problematic pattern in ${evil.length === 1 ? 'the loaded line' : 'every loaded line'}.`);
        }
        if (!prior.length) {
            parts.push('One round is a sample, not a profile. Play again and this page will compare rounds.');
        }
        return parts.join(' ');
    }

    function listIntents(names) {
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} and ${names[1]}`;
        return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
    }

    function buildIntentList(rows) {
        const section = document.createElement('section');
        section.className = 'results-block';
        const heading = document.createElement('h3');
        heading.textContent = 'This round';
        section.appendChild(heading);
        const list = document.createElement('ul');
        list.className = 'intent-score-list';
        rows.forEach((row) => {
            const item = document.createElement('li');
            item.className = row.hit === row.seen ? 'intent-hit' : 'intent-miss';
            const label = document.createElement('span');
            label.textContent = row.intent;
            const tally = document.createElement('strong');
            tally.textContent = `${row.hit}/${row.seen}`;
            item.append(label, tally);
            list.appendChild(item);
        });
        section.appendChild(list);
        return section;
    }

    function buildConfusionList(confusions) {
        const section = document.createElement('section');
        section.className = 'results-block';
        const heading = document.createElement('h3');
        heading.textContent = 'What got mixed up';
        section.appendChild(heading);
        if (!confusions.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Nothing. You named the intent on every card.';
            section.appendChild(empty);
            return section;
        }
        const list = document.createElement('ul');
        list.className = 'confusion-list';
        confusions.slice(0, 4).forEach((row) => {
            const item = document.createElement('li');
            item.textContent = `${row.from} → ${row.to}${row.count > 1 ? ` (${row.count})` : ''}`;
            list.appendChild(item);
        });
        section.appendChild(list);
        return section;
    }

    function buildCandorNote(evil, evilMissed) {
        const section = document.createElement('section');
        section.className = 'results-block candor-note';
        const heading = document.createElement('h3');
        heading.textContent = 'Candor check';
        section.appendChild(heading);
        const note = document.createElement('p');
        if (!evil.length) {
            note.textContent = 'No problematic example landed in this round.';
        } else if (evilMissed) {
            note.textContent = 'A correct label can still hide a bad pattern. Re-read the pro-tips on the lines marked as boundary-crossing.';
        } else {
            note.textContent = 'You caught the loaded language, not just the category name.';
        }
        section.appendChild(note);
        return section;
    }

    function buildHistoryNote(history, prior) {
        const section = document.createElement('section');
        section.className = 'results-block';
        const heading = document.createElement('h3');
        heading.textContent = 'Across rounds';
        section.appendChild(heading);
        const note = document.createElement('p');
        if (!prior.length) {
            note.textContent = 'No earlier rounds saved in this browser yet.';
            section.appendChild(note);
            return section;
        }
        const totals = summarizeByIntent(history).filter((row) => row.seen >= 2);
        const steady = totals.filter((row) => row.hit / row.seen >= 0.75);
        const practice = totals.filter((row) => row.hit / row.seen < 0.6);
        const bits = [`${history.length} answers saved here.`];
        if (steady.length) bits.push(`Holding steady: ${listIntents(steady.map((row) => row.intent))}.`);
        if (practice.length) bits.push(`Worth another pass: ${listIntents(practice.map((row) => row.intent))}.`);
        if (!steady.length && !practice.length) bits.push('Still too thin to call a strength or a gap.');
        note.textContent = bits.join(' ');
        section.appendChild(note);
        return section;
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