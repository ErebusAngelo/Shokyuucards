class MatchingGame {
    constructor() {
        this.currentLesson = null;
        this.gameWords = [];
        this.selectedCard = null;
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.gameActive = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.populateLessons();
    }
    
    initializeElements() {
        this.lessonSelect = document.getElementById('lessonSelect');
        this.startGameBtn = document.getElementById('startGame');
        this.newGameBtn = document.getElementById('newGame');
        this.backToMenuBtn = document.getElementById('backToMenu');
        this.gameArea = document.getElementById('gameArea');
        this.kanaCards = document.getElementById('kanaCards');
        this.spanishCards = document.getElementById('spanishCards');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.progressElement = document.getElementById('progress');
        this.gameComplete = document.getElementById('gameComplete');
        this.finalTime = document.getElementById('finalTime');
        this.finalScore = document.getElementById('finalScore');
        this.playAgainBtn = document.getElementById('playAgain');
        this.backToMenuFromCompleteBtn = document.getElementById('backToMenuFromComplete');
    }
    
    setupEventListeners() {
        this.lessonSelect.addEventListener('change', () => {
            this.startGameBtn.disabled = !this.lessonSelect.value;
        });
        
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.newGameBtn.addEventListener('click', () => this.startGame());
        this.backToMenuBtn.addEventListener('click', () => this.goBackToMenu());
        this.playAgainBtn.addEventListener('click', () => this.startGame());
        this.backToMenuFromCompleteBtn.addEventListener('click', () => this.goBackToMenu());
    }
    
    populateLessons() {
        if (typeof vocabulario === 'undefined') {
            console.error('Vocabulario data not found');
            return;
        }
        
        Object.keys(vocabulario).forEach(lesson => {
            const option = document.createElement('option');
            option.value = lesson;
            option.textContent = lesson;
            this.lessonSelect.appendChild(option);
        });
    }
    
    startGame() {
        const selectedLesson = this.lessonSelect.value;
        if (!selectedLesson) return;
        
        this.currentLesson = selectedLesson;
        this.gameWords = this.prepareGameWords(vocabulario[selectedLesson]);
        this.matchedPairs = 0;
        this.totalPairs = this.gameWords.length;
        this.score = 0;
        this.selectedCard = null;
        this.gameActive = true;
        
        this.updateScore();
        this.updateProgress();
        this.startTimer();
        this.createCards();
        this.showGameArea();
    }
    
    prepareGameWords(lessonData) {
        // Filter out optional words and get up to 8 pairs for better gameplay
        const mainWords = lessonData.filter(word => !word.optional);
        const selectedWords = this.shuffleArray(mainWords).slice(0, 8);
        return selectedWords;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    createCards() {
        this.kanaCards.innerHTML = '';
        this.spanishCards.innerHTML = '';
        
        // Create arrays for kana and spanish cards
        const kanaCardsData = this.gameWords.map((word, index) => ({
            id: `kana-${index}`,
            content: word.jp,
            type: 'kana',
            matchId: index
        }));
        
        const spanishCardsData = this.gameWords.map((word, index) => ({
            id: `spanish-${index}`,
            content: word.es,
            type: 'spanish',
            matchId: index
        }));
        
        // Shuffle both arrays independently
        const shuffledKana = this.shuffleArray(kanaCardsData);
        const shuffledSpanish = this.shuffleArray(spanishCardsData);
        
        // Create kana cards
        shuffledKana.forEach(cardData => {
            const card = this.createCard(cardData);
            this.kanaCards.appendChild(card);
        });
        
        // Create spanish cards
        shuffledSpanish.forEach(cardData => {
            const card = this.createCard(cardData);
            this.spanishCards.appendChild(card);
        });
    }
    
    createCard(cardData) {
        const card = document.createElement('div');
        card.className = `card ${cardData.type}-card`;
        card.textContent = cardData.content;
        card.dataset.matchId = cardData.matchId;
        card.dataset.type = cardData.type;
        card.dataset.id = cardData.id;
        
        card.addEventListener('click', () => this.handleCardClick(card));
        
        return card;
    }
    
    handleCardClick(card) {
        if (!this.gameActive || card.classList.contains('matched')) return;
        
        // If clicking the same card, deselect it
        if (this.selectedCard === card) {
            this.deselectCard();
            return;
        }
        
        // If no card is selected, select this one
        if (!this.selectedCard) {
            this.selectCard(card);
            return;
        }
        
        // If a card is already selected, check for match
        if (this.selectedCard.dataset.type !== card.dataset.type) {
            this.checkMatch(this.selectedCard, card);
        } else {
            // If same type, deselect previous and select new
            this.deselectCard();
            this.selectCard(card);
        }
    }
    
    selectCard(card) {
        this.selectedCard = card;
        card.classList.add('selected');
    }
    
    deselectCard() {
        if (this.selectedCard) {
            this.selectedCard.classList.remove('selected');
            this.selectedCard = null;
        }
    }
    
    checkMatch(card1, card2) {
        const match1 = parseInt(card1.dataset.matchId);
        const match2 = parseInt(card2.dataset.matchId);
        
        if (match1 === match2) {
            // Match found!
            this.handleMatch(card1, card2);
        } else {
            // No match
            this.handleNoMatch(card1, card2);
        }
    }
    
    handleMatch(card1, card2) {
        card1.classList.remove('selected');
        card2.classList.remove('selected');
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        this.matchedPairs++;
        this.score += 10;
        this.selectedCard = null;
        
        this.updateScore();
        this.updateProgress();
        
        // Check if game is complete
        if (this.matchedPairs === this.totalPairs) {
            setTimeout(() => this.completeGame(), 500);
        }
    }
    
    handleNoMatch(card1, card2) {
        // Briefly show both cards as selected, then deselect
        card2.classList.add('selected');
        
        setTimeout(() => {
            card1.classList.remove('selected');
            card2.classList.remove('selected');
            this.selectedCard = null;
        }, 800);
        
        // Small penalty for wrong match
        this.score = Math.max(0, this.score - 1);
        this.updateScore();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateProgress() {
        this.progressElement.textContent = `${this.matchedPairs}/${this.totalPairs}`;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return '00:00';
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    completeGame() {
        this.gameActive = false;
        this.stopTimer();
        
        const finalTime = this.getElapsedTime();
        this.finalTime.textContent = finalTime;
        this.finalScore.textContent = this.score;
        
        this.gameComplete.style.display = 'flex';
    }
    
    showGameArea() {
        this.gameArea.style.display = 'grid';
        this.startGameBtn.style.display = 'none';
        this.newGameBtn.style.display = 'inline-block';
        this.gameComplete.style.display = 'none';
    }
    
    hideGameArea() {
        this.gameArea.style.display = 'none';
        this.startGameBtn.style.display = 'inline-block';
        this.newGameBtn.style.display = 'none';
        this.gameComplete.style.display = 'none';
        this.stopTimer();
        this.gameActive = false;
    }
    
    goBackToMenu() {
        window.location.href = 'index.html';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MatchingGame();
});