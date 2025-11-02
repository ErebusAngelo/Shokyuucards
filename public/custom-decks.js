// Sistema de Gestión de Mazos Personalizados
class CustomDecksManager {
  constructor() {
    this.customDecks = this.loadCustomDecks();
    this.currentDeck = null;
    this.currentCard = null;
    this.editingCardIndex = -1;
    
    // Variables para rastrear el estado de conversión
    this.lastRomajiText = '';
    this.lastJapaneseText = '';
    
    this.initializeEventListeners();
  }

  // Cargar mazos personalizados del localStorage
  loadCustomDecks() {
    try {
      const saved = localStorage.getItem('shokyuu_custom_decks');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading custom decks:', error);
      return {};
    }
  }

  // Guardar mazos personalizados en localStorage
  saveCustomDecks() {
    try {
      localStorage.setItem('shokyuu_custom_decks', JSON.stringify(this.customDecks));
    } catch (error) {
      console.error('Error saving custom decks:', error);
    }
  }

  // Inicializar event listeners
  initializeEventListeners() {
    // Tab navigation
    document.getElementById('tabCustomDecks')?.addEventListener('click', () => {
      this.showCustomDecksPanel();
    });

    document.getElementById('tabLessons')?.addEventListener('click', () => {
      this.showLessonsPanel();
    });

    // Deck management
    document.getElementById('btnCreateDeck')?.addEventListener('click', () => {
      this.openDeckModal();
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
      this.closeDeckModal();
    });

    // Inicializar event listeners adicionales aquí si es necesario

    document.getElementById('btnCancelDeck')?.addEventListener('click', () => {
      this.closeDeckModal();
    });

    document.getElementById('btnSaveDeck')?.addEventListener('click', () => {
      this.saveDeck();
    });

    // Card management
    document.getElementById('btnAddCard')?.addEventListener('click', () => {
      this.openCardModal();
    });

    document.getElementById('closeCardModal')?.addEventListener('click', () => {
      this.closeCardModal();
    });

    document.getElementById('btnCancelCard')?.addEventListener('click', () => {
      this.closeCardModal();
    });

    document.getElementById('btnSaveCard')?.addEventListener('click', () => {
      this.saveCard();
    });

    // Romaji input conversion
    document.getElementById('romajiText')?.addEventListener('input', () => {
      this.convertRomaji();
    });

    // Script type selection - NO reconvierte texto existente
    document.querySelectorAll('input[name="scriptType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        // NO reconvertir texto existente - solo afecta texto nuevo
        // El cambio de script solo se aplica a futuras conversiones
      });
    });

    // Close modals when clicking outside
    document.getElementById('deckModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deckModal') {
        this.closeDeckModal();
      }
    });

    document.getElementById('cardModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'cardModal') {
        this.closeCardModal();
      }
    });
  }

  // Mostrar panel de mazos personalizados
  showCustomDecksPanel() {
    // Cambiar tabs activos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tabCustomDecks').classList.add('active');

    // Cambiar paneles activos
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('panelCustomDecks').classList.add('active');

    // Ocultar botón "Comenzar" cuando se está editando mazos
    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
      btnStart.style.display = 'none';
    }

    // Actualizar lista de mazos
    this.renderDecksList();
  }

  // Mostrar panel de lecciones
  showLessonsPanel() {
    // Cambiar tabs activos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tabLessons').classList.add('active');

    // Cambiar paneles activos
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('panelLessons').classList.add('active');

    // Mostrar botón "Comenzar" cuando se vuelve a lecciones
    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
      btnStart.style.display = 'block';
    }
  }

  // Renderizar lista de mazos
  renderDecksList() {
    const decksList = document.getElementById('decksList');
    const decks = Object.keys(this.customDecks);

    if (decks.length === 0) {
      decksList.innerHTML = '<p class="no-decks-message">No tienes mazos personalizados aún. ¡Crea tu primer mazo!</p>';
      return;
    }

    decksList.innerHTML = decks.map(deckName => {
      const deck = this.customDecks[deckName];
      const cardCount = deck.length;
      
      return `
        <div class="deck-card" data-deck-name="${deckName}">
          <h4>${deckName}</h4>
          <div class="deck-info">
            ${cardCount} tarjeta${cardCount !== 1 ? 's' : ''}
          </div>
          <div class="deck-actions">
            <button class="btn-use" onclick="customDecksManager.useDeck('${deckName}')">Usar</button>
            <button class="btn-edit" onclick="customDecksManager.editDeck('${deckName}')">Editar</button>
            <button class="btn-delete" onclick="customDecksManager.deleteDeck('${deckName}')">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Abrir modal para crear/editar mazo
  openDeckModal(deckName = null) {
    this.currentDeck = deckName;
    const modal = document.getElementById('deckModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('deckName');
    
    if (deckName) {
      title.textContent = 'Editar Mazo';
      nameInput.value = deckName;
      this.renderCardsList(this.customDecks[deckName] || []);
    } else {
      title.textContent = 'Crear Nuevo Mazo';
      nameInput.value = '';
      this.renderCardsList([]);
    }
    
    modal.classList.remove('hidden');
  }

  // Cerrar modal de mazo
  closeDeckModal() {
    document.getElementById('deckModal').classList.add('hidden');
    this.currentDeck = null;
  }

  // Guardar mazo
  saveDeck() {
    const nameInput = document.getElementById('deckName');
    const deckName = nameInput.value.trim();
    
    if (!deckName) {
      alert('Por favor, ingresa un nombre para el mazo.');
      return;
    }

    // Si estamos editando y el nombre cambió, eliminar el mazo anterior
    if (this.currentDeck && this.currentDeck !== deckName) {
      delete this.customDecks[this.currentDeck];
    }

    // Obtener las tarjetas actuales del modal
    const cards = this.getCurrentModalCards();
    
    if (cards.length === 0) {
      alert('Por favor, agrega al menos una tarjeta al mazo.');
      return;
    }

    this.customDecks[deckName] = cards;
    this.saveCustomDecks();
    this.closeDeckModal();
    this.renderDecksList();
    
    // Actualizar el selector de lecciones si es necesario
    this.updateLessonSelector();
  }

  // Obtener tarjetas actuales del modal
  getCurrentModalCards() {
    const cardsList = document.getElementById('cardsList');
    const cardItems = cardsList.querySelectorAll('.card-item');
    
    return Array.from(cardItems).map(item => {
      return JSON.parse(item.dataset.cardData);
    });
  }

  // Renderizar lista de tarjetas en el modal
  renderCardsList(cards) {
    const cardsList = document.getElementById('cardsList');
    
    if (cards.length === 0) {
      cardsList.innerHTML = '<div class="empty-cards-message">No hay tarjetas aún. Haz clic en "Agregar Tarjeta" para comenzar.</div>';
      return;
    }

    cardsList.innerHTML = cards.map((card, index) => `
      <div class="card-item" data-card-data='${JSON.stringify(card)}'>
        <div class="card-content">
          <div class="card-japanese">${card.jp}</div>
          <div class="card-spanish">${card.es}</div>
        </div>
        <div class="card-item-actions">
          <button class="btn-edit" onclick="customDecksManager.editCard(${index})">Editar</button>
          <button class="btn-delete" onclick="customDecksManager.deleteCard(${index})">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  // Abrir modal para crear/editar tarjeta
  openCardModal(cardIndex = -1) {
    this.editingCardIndex = cardIndex;
    const modal = document.getElementById('cardModal');
    const title = document.getElementById('cardModalTitle');
    
    // Limpiar formulario
    this.clearCardForm();
    
    if (cardIndex >= 0) {
      title.textContent = 'Editar Tarjeta';
      const cards = this.getCurrentModalCards();
      const card = cards[cardIndex];
      this.populateCardForm(card);
    } else {
      title.textContent = 'Agregar Tarjeta';
    }
    
    modal.classList.remove('hidden');
  }

  // Cerrar modal de tarjeta
  closeCardModal() {
    document.getElementById('cardModal').classList.add('hidden');
    this.editingCardIndex = -1;
  }

  // Limpiar formulario de tarjeta
  clearCardForm() {
    document.getElementById('japaneseText').value = '';
    document.getElementById('romajiText').value = '';
    document.getElementById('romajiDisplay').value = '';
    document.getElementById('spanishText').value = '';
    this.editingCardIndex = -1;
    
    // Resetear el estado de conversión
    this.lastRomajiText = '';
    this.lastJapaneseText = '';
  }

  // Poblar formulario con datos de tarjeta existente
  populateCardForm(card) {
    document.getElementById('japaneseText').value = card.jp;
    document.getElementById('romajiText').value = card.romaji;
    document.getElementById('romajiDisplay').value = card.romaji;
    document.getElementById('spanishText').value = card.es;
    
    // Intentar determinar el tipo de script
    if (this.isKatakana(card.jp)) {
      document.querySelector('input[name="scriptType"][value="katakana"]').checked = true;
    }
    
    // Sincronizar el estado con los valores cargados
    this.lastRomajiText = card.romaji;
    this.lastJapaneseText = card.jp;
  }

  // Verificar si el texto es katakana
  isKatakana(text) {
    const katakanaRegex = /[\u30A0-\u30FF]/;
    return katakanaRegex.test(text);
  }

  // Convertir romaji a japonés (conversión incremental inteligente)
  convertRomaji() {
    const romajiInput = document.getElementById('romajiText');
    const japaneseOutput = document.getElementById('japaneseText');
    const romajiDisplay = document.getElementById('romajiDisplay');
    
    if (!romajiInput || !japaneseOutput || !window.romajiConverter) {
      return;
    }
    
    const currentRomaji = romajiInput.value;
    
    if (!currentRomaji) {
      // Si no hay texto, limpiar todo
      japaneseOutput.value = '';
      if (romajiDisplay) romajiDisplay.value = '';
      this.lastRomajiText = '';
      this.lastJapaneseText = '';
      return;
    }

    // Detectar si el texto actual es una extensión del anterior
    if (currentRomaji.startsWith(this.lastRomajiText)) {
      // Solo hay texto nuevo al final
      const newRomaji = currentRomaji.substring(this.lastRomajiText.length);
      
      if (newRomaji) {
        // Convertir solo si el texto nuevo forma sílabas completas
        const scriptType = document.querySelector('input[name="scriptType"]:checked').value;
        
        // Intentar convertir el texto nuevo
        const convertedNew = window.romajiConverter.convert(newRomaji, scriptType);
        
        // Solo agregar si la conversión es diferente al romaji original
        // (esto significa que se convirtieron sílabas completas)
        if (convertedNew !== newRomaji) {
          japaneseOutput.value = this.lastJapaneseText + convertedNew;
          // Actualizar el estado solo si hubo conversión exitosa
          this.lastRomajiText = currentRomaji;
          this.lastJapaneseText = japaneseOutput.value;
        } else {
          // Si no se pudo convertir (consonantes solas), mantener el estado anterior
          // pero mostrar el romaji completo en el display
          japaneseOutput.value = this.lastJapaneseText;
        }
      }
    } else {
      // El texto cambió completamente, convertir todo
      const scriptType = document.querySelector('input[name="scriptType"]:checked').value;
      const converted = window.romajiConverter.convert(currentRomaji, scriptType);
      japaneseOutput.value = converted;
      this.lastRomajiText = currentRomaji;
      this.lastJapaneseText = converted;
    }
    
    if (romajiDisplay) romajiDisplay.value = currentRomaji;
  }

  // Guardar tarjeta
  saveCard() {
    const japaneseText = document.getElementById('japaneseText').value.trim();
    const spanishText = document.getElementById('spanishText').value.trim();
    const romajiText = document.getElementById('romajiText').value.trim();
    
    if (!japaneseText || !spanishText) {
      alert('Por favor, completa al menos los campos de japonés y español.');
      return;
    }

    const card = {
      jp: japaneseText,
      romaji: romajiText,
      es: spanishText
    };

    // Obtener tarjetas actuales
    let cards = this.getCurrentModalCards();
    
    if (this.editingCardIndex >= 0) {
      // Editar tarjeta existente
      cards[this.editingCardIndex] = card;
    } else {
      // Agregar nueva tarjeta
      cards.push(card);
    }
    
    this.renderCardsList(cards);
    this.closeCardModal();
  }

  // Editar tarjeta
  editCard(index) {
    this.openCardModal(index);
  }

  // Eliminar tarjeta
  deleteCard(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      let cards = this.getCurrentModalCards();
      cards.splice(index, 1);
      this.renderCardsList(cards);
    }
  }

  // Usar mazo (cambiar a lecciones y seleccionar el mazo)
  useDeck(deckName) {
    this.showLessonsPanel();
    
    // Actualizar el selector de lecciones para incluir mazos personalizados
    this.updateLessonSelector();
    
    // Seleccionar el mazo personalizado
    const unidadSelect = document.getElementById('unidadSelect');
    unidadSelect.value = `custom_${deckName}`;
    
    // Disparar evento de cambio para actualizar la interfaz
    unidadSelect.dispatchEvent(new Event('change'));
  }

  // Editar mazo
  editDeck(deckName) {
    this.openDeckModal(deckName);
  }

  // Eliminar mazo
  deleteDeck(deckName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el mazo "${deckName}"?`)) {
      delete this.customDecks[deckName];
      this.saveCustomDecks();
      this.renderDecksList();
      this.updateLessonSelector();
    }
  }

  // Actualizar selector de lecciones para incluir mazos personalizados
  updateLessonSelector() {
    const unidadSelect = document.getElementById('unidadSelect');
    if (!unidadSelect) return;

    // Obtener opciones existentes (lecciones regulares)
    const existingOptions = Array.from(unidadSelect.options).filter(option => 
      !option.value.startsWith('custom_')
    );

    // Limpiar selector
    unidadSelect.innerHTML = '';

    // Agregar lecciones regulares
    existingOptions.forEach(option => {
      unidadSelect.appendChild(option);
    });

    // Agregar separador si hay mazos personalizados
    const customDecks = Object.keys(this.customDecks);
    if (customDecks.length > 0) {
      const separator = document.createElement('option');
      separator.disabled = true;
      separator.textContent = '--- Mis Mazos ---';
      unidadSelect.appendChild(separator);

      // Agregar mazos personalizados
      customDecks.forEach(deckName => {
        const option = document.createElement('option');
        option.value = `custom_${deckName}`;
        option.textContent = `📚 ${deckName}`;
        unidadSelect.appendChild(option);
      });
    }
  }

  // Obtener datos de mazo personalizado
  getCustomDeckData(deckName) {
    return this.customDecks[deckName] || [];
  }

  // Verificar si una lección es un mazo personalizado
  isCustomDeck(lessonKey) {
    return lessonKey.startsWith('custom_');
  }

  // Obtener nombre del mazo personalizado desde la clave
  getCustomDeckName(lessonKey) {
    return lessonKey.replace('custom_', '');
  }
}

// Inicializar el gestor de mazos personalizados cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  window.customDecksManager = new CustomDecksManager();
});