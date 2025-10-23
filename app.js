const unidadSelect = document.getElementById("unidadSelect");
const reviewSelect = document.getElementById("reviewSelect");
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
const btnChangeLesson = document.getElementById("btnChangeLesson");

// Nuevos elementos para tabs y opciones
const tabLessons = document.getElementById("tabLessons");
const tabReview = document.getElementById("tabReview");
const panelLessons = document.getElementById("panelLessons");
const panelReview = document.getElementById("panelReview");
const showRomajiCheckbox = document.getElementById("showRomaji");
const shuffleCardsCheckbox = document.getElementById("shuffleCards");
const includeOptionalCheckbox = document.getElementById("includeOptional");
const includeOptionalReviewCheckbox = document.getElementById("includeOptionalReview");

let currentDeck = [];
let index = 0;
let stats = { correct: 0, wrong: 0 };
let reviewDecks = {}; // Almacena mazos de repaso por lección
let isReviewMode = false;
let currentUnit = "";
let wrongWords = []; // Palabras incorrectas en la sesión actual
let showRomaji = true; // Estado del toggle de romaji
let shuffleCards = false; // Estado del toggle de mezclar tarjetas
let includeOptional = false; // Estado del toggle de palabras opcionales

function populateUnits() {
  // Limpiar opciones existentes
  unidadSelect.innerHTML = '';
  
  Object.keys(vocabulario).forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    unidadSelect.appendChild(opt);
  });
}

function populateReviewOptions() {
  // Limpiar opciones existentes
  reviewSelect.innerHTML = '<option value="">Selecciona una lección para repasar</option>';
  
  Object.keys(reviewDecks).forEach(u => {
    if (reviewDecks[u] && reviewDecks[u].length > 0) {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = `${u} (${reviewDecks[u].length} palabras)`;
      reviewSelect.appendChild(opt);
    }
  });
}

function startDeck() {
  // Determinar si estamos en modo repaso y obtener la selección
  if (tabReview.classList.contains('active')) {
    isReviewMode = true;
    currentUnit = reviewSelect.value;
    if (!currentUnit) {
      alert('Por favor selecciona una lección para repasar');
      return;
    }
    currentDeck = [...reviewDecks[currentUnit]];
    // Obtener estado de palabras opcionales para repaso
    includeOptional = includeOptionalReviewCheckbox.checked;
  } else {
    isReviewMode = false;
    currentUnit = unidadSelect.value;
    if (!currentUnit) {
      alert('Por favor selecciona una lección');
      return;
    }
    currentDeck = [...vocabulario[currentUnit]];
    // Obtener estado de palabras opcionales para lecciones
    includeOptional = includeOptionalCheckbox.checked;
  }
  
  // Filtrar palabras opcionales si no están incluidas
  if (!includeOptional) {
    currentDeck = currentDeck.filter(word => !word.optional);
  }
  
  // Aplicar mezcla si está activada
  if (shuffleCards) {
    shuffleDeck(currentDeck);
  }
  
  index = 0;
  stats = { correct: 0, wrong: 0 };
  wrongWords = [];
  board.classList.remove("hidden");
  resultSection.classList.add("hidden");
  showCard();
  updateProgress();
}

// Función para mezclar el mazo
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function showCard() {
  if (index >= currentDeck.length) return showResult();
  
  // Primero asegurar que la tarjeta esté en el lado frontal
  card.classList.remove("flipped");
  
  // Esperar un momento para que la animación termine antes de cambiar el contenido
  setTimeout(() => {
    const item = currentDeck[index];
    cardFront.textContent = item.jp;
    
    // Mostrar u ocultar romaji según la configuración
    if (showRomaji) {
      cardBack.innerHTML = `<div>${item.jp}</div><div>${item.romaji}</div><div>${item.es}</div>`;
    } else {
      cardBack.innerHTML = `<div>${item.jp}</div><div>${item.es}</div>`;
    }
    
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
  populateUnits();
  populateReviewOptions();
  
  // Ocultar secciones
  board.classList.add("hidden");
  resultSection.classList.add("hidden");
};

// ===== FUNCIONALIDAD DE TABS =====
function switchTab(activeTab, activePanel) {
  // Remover clase active de todos los tabs y panels
  document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
    panel.classList.add('hidden');
  });
  
  // Activar el tab y panel seleccionados
  activeTab.classList.add('active');
  activePanel.classList.remove('hidden');
  activePanel.classList.add('active');
}

tabLessons.addEventListener('click', () => {
  switchTab(tabLessons, panelLessons);
});

tabReview.addEventListener('click', () => {
  switchTab(tabReview, panelReview);
  populateReviewOptions(); // Actualizar opciones de repaso al cambiar a la pestaña
});

// ===== OPCIONES DE CONFIGURACIÓN =====
showRomajiCheckbox.addEventListener('change', (e) => {
  showRomaji = e.target.checked;
  // Si hay una tarjeta activa, actualizarla inmediatamente
  if (currentDeck.length > 0 && index < currentDeck.length) {
    const item = currentDeck[index];
    if (showRomaji) {
      cardBack.innerHTML = `<div>${item.jp}</div><div>${item.romaji}</div><div>${item.es}</div>`;
    } else {
      cardBack.innerHTML = `<div>${item.jp}</div><div>${item.es}</div>`;
    }
  }
});

shuffleCardsCheckbox.addEventListener('change', (e) => {
  shuffleCards = e.target.checked;
});

// Event listeners para palabras opcionales
includeOptionalCheckbox.addEventListener('change', (e) => {
  includeOptional = e.target.checked;
});

includeOptionalReviewCheckbox.addEventListener('change', (e) => {
  includeOptional = e.target.checked;
});

// ===== CAMBIAR LECCIÓN =====
btnChangeLesson.addEventListener('click', () => {
  // Confirmar si el usuario realmente quiere cambiar de lección
  if (confirm('¿Estás seguro de que quieres cambiar de lección? Se perderá el progreso actual.')) {
    // Ocultar el tablero de juego
    board.classList.add('hidden');
    
    // Mostrar el header nuevamente
    document.querySelector('header').style.display = 'block';
    
    // Resetear variables del juego
    currentDeck = [];
    index = 0;
    stats = { correct: 0, wrong: 0 };
    wrongWords = [];
    
    // Ocultar la parte trasera de la tarjeta si está visible
    cardBack.classList.add('hidden');
  }
});

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

// ===== INICIALIZACIÓN =====
// Cargar mazos de repaso al iniciar
loadReviewDecks();
populateUnits();
populateReviewOptions();
