const unidadSelect = document.getElementById("unidadSelect");
const partSelect = document.getElementById("partSelect");
const lessonParts = document.getElementById("lessonParts");
const partInfo = document.getElementById("partInfo");
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
const reverseModeCheckbox = document.getElementById("reverseMode");

let currentDeck = [];
let originalDeck = []; // Mazo original para modo infinito
let index = 0;
let stats = { correct: 0, wrong: 0 };
let currentUnit = "";
let currentPart = "all"; // Nueva variable para la parte seleccionada
let wrongWords = []; // Palabras incorrectas en la sesión actual
let showRomaji = true; // Estado del toggle de romaji
let shuffleCards = false; // Estado del toggle de mezclar tarjetas
let includeOptional = false; // Estado del toggle de palabras opcionales
let reverseMode = false; // Estado del modo inverso (español → japonés)
let isInfiniteMode = false; // Nuevo: modo infinito
let completedWords = []; // Palabras que ya se han recordado correctamente
let rememberedWords = []; // Palabras recordadas que necesitan refuerzo
let notRememberedWords = []; // Palabras no recordadas

function populateUnits() {
  // Limpiar opciones existentes
  unidadSelect.innerHTML = '';
  
  // Agregar opción por defecto
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecciona una lección';
  unidadSelect.appendChild(defaultOption);
  
  // Agregar lecciones del vocabulario
  Object.keys(vocabulario).forEach(unit => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit;
    unidadSelect.appendChild(option);
  });
  
  // Agregar mazos personalizados si existen
  if (typeof customDecksManager !== 'undefined') {
    customDecksManager.updateLessonSelector();
  }
}

// Nueva función para generar partes de lección
function generateLessonParts(lessonWords) {
  // Filtrar solo las palabras principales (no opcionales) para la partición
  const mainWords = lessonWords.filter(word => !word.optional);
  const totalMainWords = mainWords.length;
  const parts = [];
  
  // Si la lección tiene menos de 30 palabras principales, no dividir
  if (totalMainWords < 30) {
    return parts;
  }
  
  // Dividir en partes de aproximadamente 20-25 palabras principales
  const wordsPerPart = 20;
  const numParts = Math.ceil(totalMainWords / wordsPerPart);
  
  for (let i = 0; i < numParts; i++) {
    const start = i * wordsPerPart;
    const end = Math.min(start + wordsPerPart, totalMainWords);
    parts.push({
      id: `part-${i + 1}`,
      name: `Parte ${i + 1} (${start + 1}-${end})`,
      start: start,
      end: end,
      count: end - start
    });
  }
  
  return parts;
}

// Nueva función para actualizar las opciones de partes
function updatePartOptions() {
  const selectedLesson = unidadSelect.value;
  
  if (!selectedLesson) {
    lessonParts.style.display = 'none';
    return;
  }
  
  // Si es un mazo personalizado, no mostrar opciones de partes
  if (selectedLesson.startsWith('custom_')) {
    lessonParts.style.display = 'none';
    return;
  }
  
  const lessonWords = vocabulario[selectedLesson] || [];
  const mainWords = lessonWords.filter(word => !word.optional);
  const optionalWords = lessonWords.filter(word => word.optional);
  const parts = generateLessonParts(lessonWords);
  
  // Detectar el estado actual del checkbox de palabras opcionales
  const includeOptionalWords = includeOptionalCheckbox.checked;
  
  // Calcular el número real de palabras según el checkbox
  const actualWordCount = includeOptionalWords ? lessonWords.length : mainWords.length;
  
  // Limpiar opciones existentes
  partSelect.innerHTML = '';
  
  // Agregar opción de lección completa con conteo dinámico
  const completeOption = document.createElement('option');
  completeOption.value = 'all';
  completeOption.textContent = `Lección completa (${actualWordCount} palabras)`;
  partSelect.appendChild(completeOption);
  
  // Si hay partes o palabras opcionales, mostrar el selector
  if (parts.length > 0 || optionalWords.length > 0) {
    lessonParts.style.display = 'flex';
    
    // Agregar opciones de partes (basadas en palabras principales)
    parts.forEach(part => {
      const option = document.createElement('option');
      option.value = part.id;
      option.textContent = part.name;
      partSelect.appendChild(option);
    });
    
    // Agregar opción para palabras opcionales si existen
    if (optionalWords.length > 0) {
      const optionalOption = document.createElement('option');
      optionalOption.value = 'optional-only';
      optionalOption.textContent = `Solo palabras extras (${optionalWords.length} palabras)`;
      partSelect.appendChild(optionalOption);
    }
    
    let infoText = `Esta lección tiene ${mainWords.length} palabras principales`;
    if (optionalWords.length > 0) {
      infoText += ` y ${optionalWords.length} palabras extras`;
    }
    if (parts.length > 0) {
      infoText += `. Puedes estudiarla por partes.`;
    } else {
      infoText += `.`;
    }
    partInfo.textContent = infoText;
  } else {
    lessonParts.style.display = 'none';
  }
}

function startDeck() {
  isInfiniteMode = false;
  index = 0;
  stats = { correct: 0, wrong: 0 };
  wrongWords = [];
  completedWords = [];
  rememberedWords = [];
  notRememberedWords = [];
  
  const selectedUnit = unidadSelect.value;
  const selectedPart = partSelect.value;
  
  if (!selectedUnit) {
    alert("Por favor selecciona una lección");
    return;
  }
  
  currentUnit = selectedUnit;
  currentPart = selectedPart;
  
  let words = [];
  
  // Verificar si es un mazo personalizado
  if (selectedUnit.startsWith('custom_')) {
    const deckName = selectedUnit.replace('custom_', '');
    if (typeof customDecksManager !== 'undefined' && customDecksManager.customDecks[deckName]) {
      words = customDecksManager.customDecks[deckName] || [];
    } else {
      alert("Mazo personalizado no encontrado");
      return;
    }
  } else {
    // Lección regular
    words = vocabulario[selectedUnit] || [];
    
    // Manejar diferentes tipos de selección
    if (selectedPart === 'optional-only') {
      // Solo palabras opcionales
      words = words.filter(word => word.optional);
    } else if (selectedPart === 'all') {
      // Lección completa - aplicar filtro de opcionales según checkbox
      if (!includeOptional) {
        words = words.filter(word => !word.optional);
      }
    } else if (selectedPart.startsWith('part-')) {
      // Parte específica - solo palabras principales
      const mainWords = words.filter(word => !word.optional);
      const parts = generateLessonParts(vocabulario[selectedUnit] || []);
      const selectedPartData = parts.find(part => part.id === selectedPart);
      
      if (selectedPartData) {
        words = mainWords.slice(selectedPartData.start, selectedPartData.end);
      }
    }
  }
  
  if (words.length === 0) {
    alert("No hay palabras disponibles para esta selección");
    return;
  }
  
  currentDeck = [...words];
  originalDeck = [...words];
  
  if (shuffleCards) {
    shuffleDeck(currentDeck);
  }
  
  updateProgress();
  showCard();
  
  // Mostrar el tablero y ocultar otros elementos
  document.querySelector('.app header').classList.add('hidden');
  board.classList.remove('hidden');
  resultSection.classList.add('hidden');
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
    
    // Modo inverso: mostrar español en el frente y japonés en la parte trasera
    if (reverseMode) {
      cardFront.textContent = item.es;
      
      // Mostrar u ocultar romaji según la configuración en modo inverso
      if (showRomaji) {
        cardBack.innerHTML = `<div>${item.jp}</div><div>${item.romaji}</div><div>${item.es}</div>`;
      } else {
        cardBack.innerHTML = `<div>${item.jp}</div><div>${item.es}</div>`;
      }
    } else {
      // Modo normal: mostrar japonés en el frente y español en la parte trasera
      cardFront.textContent = item.jp;
      
      // Mostrar u ocultar romaji según la configuración
      if (showRomaji) {
        cardBack.innerHTML = `<div>${item.jp}</div><div>${item.romaji}</div><div>${item.es}</div>`;
      } else {
        cardBack.innerHTML = `<div>${item.jp}</div><div>${item.es}</div>`;
      }
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
  
  // Información de la parte según el tipo de selección
  let partInfo = '';
  if (currentPart === 'optional-only') {
    partInfo = ' - Solo palabras opcionales';
  } else if (currentPart.startsWith('part-')) {
    const parts = generateLessonParts(vocabulario[currentUnit] || []);
    const selectedPartData = parts.find(part => part.id === currentPart);
    if (selectedPartData) {
      partInfo = ` - ${selectedPartData.name}`;
    }
  }
  
  progressText.innerHTML = `
    <div class="progress-info">
      <div class="lesson-info">${currentUnit}${partInfo}</div>
      <div class="card-counter">${currentPosition}/${totalWords}${modeText}</div>
      <div class="stats">Recordadas: ${rememberedWords.length} | No recordadas: ${notRememberedWords.length}</div>
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

// Event listeners
unidadSelect.addEventListener("change", updatePartOptions);
partSelect.addEventListener("change", function() {
  currentPart = partSelect.value;
});

btnStart.addEventListener("click", startDeck);
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
  // Actualizar las opciones de partes cuando cambie el checkbox
  updatePartOptions();
});

// Event listener para modo inverso
reverseModeCheckbox.addEventListener('change', (e) => {
  reverseMode = e.target.checked;
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
  currentPart = "all"; // Resetear la parte seleccionada
  
  // Limpiar el contador visual
  progressText.innerHTML = '';
  
  // Resetear selectores
  unidadSelect.value = '';
  partSelect.value = 'all';
  lessonParts.style.display = 'none';
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
