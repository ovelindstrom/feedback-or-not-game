# Feedback or Not Game

This is an interactive web-based game designed to help players develop skills in distinguishing between different types of workplace feedback.

## Overview

The Feedback or Not Game challenges players to classify statements into categories such as Advice, Appreciation, Coaching, Criticism, Encouragement, Evaluation, Praise, Psychological Evaluation, Interpersonal Feedback, and more. The game includes questions marked with varying levels of appropriateness to help learners understand what constitutes constructive feedback versus problematic feedback patterns.

## Getting Started

### Prerequisites

- Python 3.x installed on your system

### Running Locally

To run this game locally on your machine:

1. **Navigate to the project directory:**
   ```bash
   cd feedback-or-not-game
   ```

2. **Start a Python HTTP server on port 8000:**
   ```bash
   python -m http.server 8000
   ```

3. **Open your browser and visit:**
   ```
   http://localhost:8000
   ```

4. **To stop the server**, press `Ctrl+C` in your terminal.

## Project Structure

- `index.html` - Main game interface
- `intents.html` - Feedback categories and definitions
- `script.js` - Game logic and interactivity
- `style.css` - Styling and layout
- `data/questions.json` - Question bank and answers
- `data/intents.json` - Feedback type definitions

## Game Mechanics

### Spaced Repetition Learning

The game uses a spaced repetition strategy to optimize learning:

- **Each game consists of 12 questions**
- **~33% from previously seen questions (4 questions)** - Reinforces learning and improves retention
- **~67% from new, unseen questions (8 questions)** - Continues introducing new content

This approach is based on proven learning science: reviewing previously encountered material at intervals significantly improves long-term retention. As you play multiple games, you'll encounter a mix of familiar questions (for reinforcement) and new ones (for continued learning).

### Question Tracking

Your progress is saved locally using your browser's localStorage. The game tracks which questions you've already answered to ensure variety across games and to implement the spaced repetition strategy.

### Feedback Quality Levels

Questions are marked with an `isEvil` flag to indicate problematic feedback patterns:
- **Green (constructive)** - Examples of appropriate, helpful feedback
- **Red (problematic)** - Examples of feedback that violates professional boundaries or uses manipulation tactics

Learning to identify both good and bad feedback patterns is essential for workplace communication.

## Influences

This project was inspired by several open-source educational platforms and games that demonstrate effective learning strategies:

### Spaced Repetition & Learning Science
- **[Carden](https://github.com/alyssaxuu/carden)** ⭐ 480 stars - Flashcards with spaced repetition and gamification, demonstrating how to combine learning algorithms with engaging game mechanics
- **[FlashCards](https://github.com/JohnDamilola/FlashCards)** - Spaced repetition learning platform 
- **[AnyMemo](https://github.com/helloworld1/AnyMemo)** - Advanced spaced repetition software

### Interactive Web Game Architecture
- **[Ultimate Collection of 30 Interactive Web Games](https://github.com/abdullahbinfahad/Ultimate-Collection-of-30-Interactive-Web-Games-HTML-CSS-JavaScript-Projects)** - Multiple mini games demonstrating DOM manipulation and game mechanics
- **[game-collection](https://github.com/efrat-dev/game-collection)** - Web games using localStorage for state management
- **[Interactive-Quiz-Game](https://github.com/RajChauhan08/Interactive-Quiz-Game)** - Multiple choice quiz with instant feedback

### Educational Gamification
- **[EducationalGames](https://github.com/H7-code/EducationalGames)** - Pop Quiz and educational gaming platform
- **[MARIO - Amazon Q Retro](https://github.com/mikechiloane/amario-amazon-q-retro)** - Educational game with integrated quiz system

The Feedback or Not Game combines the best practices from these projects: spaced repetition learning, interactive web game design, and instant feedback mechanisms to create an engaging tool for developing workplace communication skills.

## AI usage

Almost everything in this was coded using promting, agents and vibe coding, just for the fun of it. In total, I spent around 2 hours.
I used an Open Claw agent to research and come up with questions. I had 12 initial questions from a presentation I do on the topic.
I used GitHub Copilot Pro for most of the coding.

## License

This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License. See [LICENSE.md](LICENSE.md) for details.
