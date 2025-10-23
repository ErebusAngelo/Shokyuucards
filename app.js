const unidadSelect = document.getElementById("unidadSelect");
const btnStart = document.getElementById("btnStart");
const board = document.getElementById("board");
const card = document.getElementById("card");
const playAudioBtn = document.getElementById("playAudio");
const cardFront = document.getElementById("cardFront");
const cardBack = document.getElementById("cardBack");
const btnGot = document.getElementById("btnGot");
const btnNotGot = document.getElementById("btnNotGot");
const progressText = document.getElementById("progressText");
const resultSection = document.getElementById("result");
const resultText = document.getElementById("resultText");
const btnRestart = document.getElementById("btnRestart");

let currentDeck = [];
let index = 0;
let stats = { correct: 0, wrong: 0 };
let reviewDecks = {}; // Almacena mazos de repaso por lección
let isReviewMode = false;
let currentUnit = "";
let wrongWords = []; // Palabras incorrectas en la sesión actual

function populateUnits() {
  Object.keys(vocabulario).forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    unidadSelect.appendChild(opt);
    
    // Agregar opción de repaso si existe
    if (reviewDecks[u] && reviewDecks[u].length > 0) {
      const reviewOpt = document.createElement("option");
      reviewOpt.value = u + "_review";
      reviewOpt.textContent = u + " (Repaso - " + reviewDecks[u].length + " palabras)";
      unidadSelect.appendChild(reviewOpt);
    }
  });
}

function startDeck() {
  const selection = unidadSelect.value;
  isReviewMode = selection.includes("_review");
  currentUnit = isReviewMode ? selection.replace("_review", "") : selection;
  
  if (isReviewMode) {
    currentDeck = [...reviewDecks[currentUnit]];
  } else {
    currentDeck = [...vocabulario[currentUnit]];
  }
  
  index = 0;
  stats = { correct: 0, wrong: 0 };
  wrongWords = [];
  board.classList.remove("hidden");
  resultSection.classList.add("hidden");
  showCard();
  updateProgress();
}

function showCard() {
  if (index >= currentDeck.length) return showResult();
  
  // Primero asegurar que la tarjeta esté en el lado frontal
  card.classList.remove("flipped");
  
  // Esperar un momento para que la animación termine antes de cambiar el contenido
  setTimeout(() => {
    const item = currentDeck[index];
    cardFront.textContent = item.jp;
    cardBack.innerHTML = `<div>${item.jp}</div><div>${item.romaji}</div><div>${item.es}</div>`;
    // Remover la clase hidden del cardBack para que sea visible cuando se voltee
    cardBack.classList.remove("hidden");
  }, 50); // Pequeño delay para evitar el flash del contenido anterior
}

card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

btnGot.onclick = () => { 
  stats.correct++; 
  
  // Si estamos en modo repaso, quitar la palabra del mazo de repaso
  if (isReviewMode) {
    const currentWord = currentDeck[index];
    reviewDecks[currentUnit] = reviewDecks[currentUnit].filter(word => 
      word.jp !== currentWord.jp || word.romaji !== currentWord.romaji
    );
    saveReviewDecks();
  }
  
  nextCard(); 
};

btnNotGot.onclick = () => { 
  stats.wrong++; 
  
  // Agregar palabra a la lista de palabras incorrectas
  wrongWords.push(currentDeck[index]);
  
  nextCard(); 
};

function nextCard() {
  index++;
  updateProgress();
  showCard();
}

function updateProgress() {
  const modeText = isReviewMode ? " (Repaso)" : "";
  progressText.textContent = `${Math.min(index + 1, currentDeck.length)} / ${currentDeck.length}${modeText}`;
}

function showResult() {
  board.classList.add("hidden");
  resultSection.classList.remove("hidden");
  const total = stats.correct + stats.wrong;
  const pct = Math.round((stats.correct / total) * 100);
  
  let resultHTML = `✔️ Correctas: ${stats.correct}<br>❌ Incorrectas: ${stats.wrong}<br><br><strong>${pct}%</strong> aciertos`;
  
  // Si hay palabras incorrectas y no estamos en modo repaso, crear/actualizar mazo de repaso
  if (wrongWords.length > 0 && !isReviewMode) {
    if (!reviewDecks[currentUnit]) {
      reviewDecks[currentUnit] = [];
    }
    
    // Agregar palabras incorrectas al mazo de repaso (evitar duplicados)
    wrongWords.forEach(word => {
      const exists = reviewDecks[currentUnit].some(reviewWord => 
        reviewWord.jp === word.jp && reviewWord.romaji === word.romaji
      );
      if (!exists) {
        reviewDecks[currentUnit].push(word);
      }
    });
    
    saveReviewDecks();
    resultHTML += `<br><br>📚 Se creó un mazo de repaso con ${wrongWords.length} palabra(s) nueva(s).<br>Total en repaso: ${reviewDecks[currentUnit].length} palabras`;
  }
  
  // Si terminamos un repaso y no quedan palabras
  if (isReviewMode && reviewDecks[currentUnit] && reviewDecks[currentUnit].length === 0) {
    resultHTML += `<br><br>🎉 ¡Felicidades! Has completado el repaso de ${currentUnit}`;
    delete reviewDecks[currentUnit];
    saveReviewDecks();
  }
  
  resultText.innerHTML = resultHTML;
}

function saveReviewDecks() {
  localStorage.setItem('reviewDecks', JSON.stringify(reviewDecks));
}

function loadReviewDecks() {
  const saved = localStorage.getItem('reviewDecks');
  if (saved) {
    reviewDecks = JSON.parse(saved);
  }
}

btnStart.onclick = startDeck;
btnRestart.onclick = () => {
  // Recargar las opciones del select para mostrar mazos de repaso actualizados
  unidadSelect.innerHTML = '';
  populateUnits();
  
  // Ocultar secciones
  board.classList.add("hidden");
  resultSection.classList.add("hidden");
};

// ===== AUDIO DE PRONUNCIACIÓN =====
playAudioBtn.addEventListener("click", (event) => {
  event.stopPropagation(); // Evitar que el click se propague al card y lo voltee
  const item = currentDeck[index];
  if (!item || !item.jp) return;
  const utterance = new SpeechSynthesisUtterance(item.jp);
  utterance.lang = "ja-JP"; // japonés
  utterance.rate = 0.9; // velocidad natural
  speechSynthesis.speak(utterance);
});

// Cargar mazos de repaso al iniciar
loadReviewDecks();
populateUnits();
