function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    return suits.flatMap(suit => ranks.map(rank => `${rank}${suit}`));
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function deal(deck, n) {
    return deck.splice(0, n);
}

// Make functions global so game.js can use them
window.createDeck = createDeck;
window.shuffle = shuffle;
window.deal = deal;