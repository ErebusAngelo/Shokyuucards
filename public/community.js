class CommunityManager {
    constructor() {
        this.communityDecks = [];
        this.initListeners();
    }

    initListeners() {
        document.getElementById('tabCommunity')?.addEventListener('click', () => {
            this.showCommunityPanel();
            this.loadCommunityDecks();
        });
    }

    showCommunityPanel() {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const tabList = document.getElementById('tabCommunity');
        if (tabList) tabList.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        const panel = document.getElementById('panelCommunity');
        if (panel) panel.classList.add('active');

        const btnStart = document.getElementById('btnStart');
        if (btnStart) btnStart.style.display = 'none';
        
        // Hide lesson options if switching to community
        const lessonParts = document.getElementById('lessonParts');
        if (lessonParts) lessonParts.style.display = 'none';
    }

    async loadCommunityDecks() {
        const listContainer = document.getElementById('communityDecksList');
        listContainer.innerHTML = '<div class="fsc-spinner"></div><p style="text-align: center;">Cargando mazos...</p>';
        
        try {
            const res = await fetch(`${window.API_URL}/decks/community`);
            const data = await res.json();
            if (res.ok && data.decks) {
                this.communityDecks = data.decks;
                this.renderDecks(this.communityDecks);
            } else {
                listContainer.innerHTML = '<p class="error-msg">No se pudieron cargar los mazos comunitarios.</p>';
            }
        } catch (error) {
            console.error(error);
            listContainer.innerHTML = '<p class="error-msg">Error de conexión al cargar la comunidad.</p>';
        }
    }

    renderDecks(decks) {
        const listContainer = document.getElementById('communityDecksList');
        if (decks.length === 0) {
            listContainer.innerHTML = '<p class="no-decks-message">Aún no hay mazos en la comunidad. ¡Sé el primero en aportar el tuyo!</p>';
            return;
        }

        const currentEmail = window.authSystem?.user?.email || '';

        listContainer.innerHTML = decks.map(deck => {
            const upvotes = deck.upvotes || [];
            const downvotes = deck.downvotes || [];
            const score = upvotes.length - downvotes.length;
            const cardCount = deck.cards ? deck.cards.length : 0;
            const hasUpvoted = upvotes.includes(currentEmail);
            const hasDownvoted = downvotes.includes(currentEmail);

            return `
            <div class="deck-card community-deck-card">
              <div class="deck-header">
                <h4>${deck.name}</h4>
                <span class="deck-creator">por @${deck.creatorUsername || 'Anónimo'}</span>
              </div>
              <div class="deck-info">
                ${cardCount} tarjeta${cardCount !== 1 ? 's' : ''}
              </div>
              <div class="community-actions">
                <div class="vote-buttons">
                    <button class="btn-vote ${hasUpvoted ? 'active-up' : ''}" onclick="window.communityManager.voteDeck('${deck._id}', 'up')">👍 ${upvotes.length}</button>
                    <span class="score ${score > 0 ? 'positive-score' : score < 0 ? 'negative-score' : ''}">${score}</span>
                    <button class="btn-vote ${hasDownvoted ? 'active-down' : ''}" onclick="window.communityManager.voteDeck('${deck._id}', 'down')">👎 ${downvotes.length}</button>
                </div>
                <button class="btn-download" onclick="window.communityManager.downloadDeck('${deck._id}')">💾 Importar</button>
              </div>
            </div>`;
        }).join('');
    }

    async publishDeck(localDeckName) {
        if (!window.authSystem || !window.authSystem.user) {
            alert('🔒 Debes iniciar sesión con tu cuenta para poder publicar mazos en la comunidad y que la gente te identifique como el autor!');
            return;
        }

        if (!window.customDecksManager || !window.customDecksManager.customDecks[localDeckName]) {
            alert('El mazo local no existe.');
            return;
        }
        
        const cards = window.customDecksManager.customDecks[localDeckName];
        if (cards.length === 0) {
            alert('No puedes publicar un mazo vacío.');
            return;
        }

        const confirmPublish = confirm(`¿Estás seguro que deseas publicar el mazo "${localDeckName}" en la comunidad global? Si ya lo habías publicado, se actualizará.`);
        if (!confirmPublish) return;

        try {
            const res = await fetch(`${window.API_URL}/decks/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: localDeckName, cards })
            });

            const data = await res.json();
            if (res.ok) {
                alert('¡Mazo publicado exitosamente en la comunidad!');
                if (document.getElementById('tabCommunity').classList.contains('active')) {
                    this.loadCommunityDecks(); // reload if tab is active
                }
            } else {
                alert(data.error || 'Ocurrió un error al publicar.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    }

    async voteDeck(deckId, type) {
        if (!window.authSystem?.user) {
            alert("Debes iniciar sesión para votar.");
            return;
        }

        try {
            const res = await fetch(`${window.API_URL}/decks/${deckId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ voteType: type })
            });

            const data = await res.json();
            if (res.ok) {
                // Actualizar cuenta localmente
                const deck = this.communityDecks.find(d => d._id === deckId);
                if (deck) {
                    deck.upvotes = data.upvotes || [];
                    deck.downvotes = data.downvotes || [];
                    this.renderDecks(this.communityDecks);
                }
            } else {
                alert(data.error || 'Error al votar.');
            }
        } catch (error) {
            console.error('Vote error:', error);
        }
    }

    downloadDeck(deckId) {
        const deck = this.communityDecks.find(d => d._id === deckId);
        if (!deck) return;

        if (!window.customDecksManager) return;
        
        let localName = deck.name;
        // Evitar colisiones de nombres si el usuario ya lo tiene
        if (window.customDecksManager.customDecks[localName]) {
            localName = `${deck.name} (de ${deck.creatorUsername || 'Comunidad'})`;
            
            // Si incluso el sufijo existe, le agregamos un sufijo random
            if (window.customDecksManager.customDecks[localName]) {
                 localName = `${localName} ${Math.floor(Math.random()*1000)}`;
            }
        }

        window.customDecksManager.customDecks[localName] = deck.cards;
        window.customDecksManager.saveCustomDecks();
        window.customDecksManager.updateLessonSelector();

        alert(`¡El mazo se ha guardado como "${localName}" en tus mazos locales listos para usar!`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.communityManager = new CommunityManager();
});
