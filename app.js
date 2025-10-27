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
const btnChangeLesson = document.getElementById("btnChangeLesson");

// Elementos para opciones
const tabLessons = document.getElementById("tabLessons");
const panelLessons = document.getElementById("panelLessons");
const showRomajiCheckbox = document.getElementById("showRomaji");
const shuffleCardsCheckbox = document.getElementById("shuffleCards");
const includeOptionalCheckbox = document.getElementById("includeOptional");

let currentDeck = [];
let originalDeck = []; // Mazo original para modo infinito
let index = 0;
let stats = { correct: 0, wrong: 0 };
let currentUnit = "";
let wrongWords = []; // Palabras incorrectas en la sesión actual
let showRomaji = true; // Estado del toggle de romaji
let shuffleCards = false; // Estado del toggle de mezclar tarjetas
let includeOptional = false; // Estado del toggle de palabras opcionales
let isInfiniteMode = false; // Nuevo: modo infinito
let completedWords = []; // Palabras que ya se han recordado correctamente
let rememberedWords = []; // Palabras recordadas que necesitan refuerzo
let notRememberedWords = []; // Palabras no recordadas

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

function startDeck() {
  isInfiniteMode = false;
  currentUnit = unidadSelect.value;
  if (!currentUnit) {
    alert('Por favor selecciona una lección');
    return;
  }
  currentDeck = [...vocabulario[currentUnit]];
  originalDeck = [...vocabulario[currentUnit]];
  // Obtener estado de palabras opcionales para lecciones
  includeOptional = includeOptionalCheckbox.checked;
  
  // Filtrar palabras opcionales si no están incluidas
  if (!includeOptional) {
    currentDeck = currentDeck.filter(word => !word.optional);
    originalDeck = originalDeck.filter(word => !word.optional);
  }
  
  // Aplicar mezcla si está activada
  if (shuffleCards) {
    shuffleDeck(currentDeck);
  }
  
  index = 0;
  stats = { correct: 0, wrong: 0 }; // Reiniciar stats completamente
  wrongWords = [];
  completedWords = [];
  rememberedWords = [];
  notRememberedWords = [];
  
  // Mostrar el tablero y ocultar otros elementos
  document.querySelector('.app header').classList.add('hidden');
  board.classList.remove('hidden');
  resultSection.classList.add('hidden');
  
  showCard();
  updateProgress(); // Actualizar contador al iniciar nueva lección
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function showCard() {
  // Si hemos terminado todas las cartas del mazo actual
  if (index >= currentDeck.length) {
    // Si hay palabras incorrectas, agregarlas al final del mazo (SIN palabras recordadas)
    if (wrongWords.length > 0) {
      // Crear un nuevo mazo solo con las palabras incorrectas para la nueva ronda
      currentDeck = [...wrongWords];
      
      // Mezclar las palabras incorrectas
      shuffleDeck(currentDeck);
      
      // Reiniciar solo el índice para la nueva ronda
      index = 0;
      
      // Limpiar wrongWords para la nueva ronda
      wrongWords = [];
      updateProgress();
      showCard();
      return;
    }
    // Si no hay palabras incorrectas, mostrar resultado
    return showResult();
  }
  
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
  
  // Agregar palabra a recordadas si no está ya
  const currentWord = currentDeck[index];
  const alreadyRemembered = rememberedWords.some(word => 
    word.jp === currentWord.jp && word.romaji === currentWord.romaji
  );
  
  if (!alreadyRemembered) {
    rememberedWords.push(currentWord);
  }
  
  // Agregar a completadas si no está ya
  const alreadyCompleted = completedWords.some(word => 
    word.jp === currentWord.jp && word.romaji === currentWord.romaji
  );
  
  if (!alreadyCompleted) {
    completedWords.push(currentWord);
  }
  
  // Remover de palabras no recordadas si estaba ahí
  notRememberedWords = notRememberedWords.filter(word => 
    word.jp !== currentWord.jp || word.romaji !== currentWord.romaji
  );
  
  // IMPORTANTE: Remover de wrongWords si estaba ahí (para que no se repita)
  wrongWords = wrongWords.filter(word => 
    word.jp !== currentWord.jp || word.romaji !== currentWord.romaji
  );
  
  nextCard(); 
};

btnNotGot.onclick = () => { 
  stats.wrong++; 
  
  // Solo agregar a wrongWords si no está ya ahí
  const currentWord = currentDeck[index];
  const alreadyInWrong = wrongWords.some(word => 
    word.jp === currentWord.jp && word.romaji === currentWord.romaji
  );
  
  if (!alreadyInWrong) {
    wrongWords.push(currentWord);
  }
  
  // Agregar a no recordadas si no está ya
  const alreadyNotRemembered = notRememberedWords.some(word => 
    word.jp === currentWord.jp && word.romaji === currentWord.romaji
  );
  
  if (!alreadyNotRemembered) {
    notRememberedWords.push(currentWord);
  }
  
  nextCard(); 
};

function nextCard() {
  index++;
  updateProgress();
  showCard();
}

function updateProgress() {
  let modeText = "";
  if (isInfiniteMode) {
    modeText = " (Modo Infinito)";
  }
  
  // El contador superior siempre muestra el progreso de la ronda actual
  const totalWords = currentDeck.length;
  const currentPosition = Math.min(index + 1, totalWords);
  
  progressText.innerHTML = `
    <div>${currentPosition} / ${totalWords}${modeText}</div>
    <div style="font-size: 12px; margin-top: 4px;">
      <span style="color: #10b981;">✓ Recordadas: ${rememberedWords.length}</span> | 
      <span style="color: #ef4444;">✗ No recordadas: ${notRememberedWords.length}</span>
    </div>
  `;
}

function showResult() {
  board.classList.add("hidden");
  resultSection.classList.remove("hidden");
  
  let resultHTML = ``;
  
  // Si completamos todas las palabras sin errores o estamos en modo infinito
  if (wrongWords.length === 0) {
    if (isInfiniteMode) {
      resultHTML += `🔄 Sesión de modo infinito completada`;
    } else {
      resultHTML += `🎉 ¡Excelente! Has recordado todas las palabras correctamente`;
    }
    
    // Agregar botón para modo infinito si no estamos ya en él
    if (!isInfiniteMode) {
      resultHTML += `<br><br><button id="btnInfiniteMode" class="btn" style="margin: 10px; padding: 12px 24px; background: var(--gradient-primary); border: none; border-radius: 8px; color: white; cursor: pointer;">🔄 Continuar en Modo Infinito</button>`;
    }
  } else {
    resultHTML += `📚 Lección completada`;
  }
  
  resultText.innerHTML = resultHTML;
  
  // Agregar event listener para el botón de modo infinito
  const btnInfiniteMode = document.getElementById('btnInfiniteMode');
  if (btnInfiniteMode) {
    btnInfiniteMode.onclick = startInfiniteMode;
  }
}

function startInfiniteMode() {
  isInfiniteMode = true;
  
  // Reiniciar con el mazo original
  currentDeck = [...originalDeck];
  
  // Aplicar mezcla si está activada
  if (shuffleCards) {
    shuffleDeck(currentDeck);
  }
  
  index = 0;
  stats = { correct: 0, wrong: 0 }; // Reiniciar stats completamente
  wrongWords = [];
  rememberedWords = [];
  notRememberedWords = [];
  
  // Mostrar el tablero y ocultar resultado
  board.classList.remove('hidden');
  resultSection.classList.add('hidden');
  
  showCard();
}

btnStart.onclick = startDeck;
btnRestart.onclick = () => {
  board.classList.add('hidden');
  resultSection.classList.add('hidden');
  document.querySelector('.app header').classList.remove('hidden');
};

// Event listeners para checkboxes
showRomajiCheckbox.addEventListener('change', (e) => {
  showRomaji = e.target.checked;
  
  // Si hay una tarjeta visible, actualizar su contenido
  if (!board.classList.contains('hidden') && index < currentDeck.length) {
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

// Event listener para cambiar lección
btnChangeLesson.addEventListener('click', () => {
  board.classList.add('hidden');
  resultSection.classList.add('hidden');
  document.querySelector('.app header').classList.remove('hidden');
  
  // Reset COMPLETO de todas las variables
  isInfiniteMode = false;
  currentDeck = [];
  originalDeck = [];
  index = 0;
  stats = { correct: 0, wrong: 0 }; // Reiniciar stats completamente
  wrongWords = [];
  completedWords = [];
  rememberedWords = [];
  notRememberedWords = [];
  
  // Limpiar el contador visual
  progressText.innerHTML = '';
});

// Event listener para audio
playAudioBtn.addEventListener("click", (event) => {
  event.stopPropagation(); // Evitar que se voltee la tarjeta
  const currentWord = currentDeck[index];
  if (currentWord) {
    // Usar síntesis de voz del navegador para pronunciar la palabra japonesa
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.jp);
      utterance.lang = 'ja-JP'; // Configurar idioma japonés
      utterance.rate = 0.8; // Velocidad más lenta para mejor comprensión
      utterance.pitch = 1; // Tono normal
      speechSynthesis.speak(utterance);
    } else {
      console.log('La síntesis de voz no está disponible en este navegador');
    }
  }
});

// Prevenir eventos de selección y arrastre en dispositivos móviles
function preventMobileSelection() {
  // Prevenir selección de texto en toda la aplicación
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Prevenir menú contextual en dispositivos móviles
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Prevenir arrastre de elementos
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Prevenir eventos de toque prolongado en iOS
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevenir zoom con pellizco
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevenir eventos específicos en las tarjetas
  const preventCardEvents = (element) => {
    if (element) {
      element.addEventListener('selectstart', (e) => e.preventDefault());
      element.addEventListener('dragstart', (e) => e.preventDefault());
      element.addEventListener('contextmenu', (e) => e.preventDefault());
      
      // Prevenir eventos de toque prolongado específicamente en las tarjetas
      let touchTimer;
      element.addEventListener('touchstart', (e) => {
        touchTimer = setTimeout(() => {
          e.preventDefault();
        }, 500);
      }, { passive: false });
      
      element.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
      });
      
      element.addEventListener('touchmove', () => {
        clearTimeout(touchTimer);
      });
    }
  };

  // Aplicar prevención a elementos específicos
  preventCardEvents(card);
  preventCardEvents(cardFront);
  preventCardEvents(cardBack);
}

// Inicialización
populateUnits();
preventMobileSelection(); // Inicializar prevención de eventos móviles
