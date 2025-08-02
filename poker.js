/**
 * poker.js
 * A comprehensive Texas Hold'em poker simulator.
 * This file includes logic for deck management, hand evaluation,
 * winner determination, and NPC AI.
 */

// --- Constants for Cards and Hand Ranks ---

const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Assign numerical values to ranks for easy comparison. Ace can be high (14) or low (1 for straights A-5).
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Define the hierarchy of poker hands.
const HAND_RANKS = {
    HIGH_CARD: 0,
    ONE_PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
    ROYAL_FLUSH: 9,
};

// Human-readable names for hand ranks.
const HAND_RANK_NAMES = [
    "High Card", "One Pair", "Two Pair", "Three of a Kind", "Straight", "Flush",
    "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"
];


// --- Core Deck Functions ---

/**
 * Creates a standard 52-card deck.
 * @returns {string[]} An array of 52 cards, e.g., ['2♥', '3♥', ..., 'A♠'].
 */
function createDeck() {
    // Use flatMap to combine suits and ranks into a single deck array.
    return SUITS.flatMap(suit => RANKS.map(rank => rank + suit));
}

/**
 * Shuffles a deck of cards in place using the Fisher-Yates algorithm.
 * @param {string[]} deck - The deck to be shuffled.
 */
function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
}

/**
 * Deals a specified number of cards from the top of the deck.
 * @param {string[]} deck - The deck to deal from.
 * @param {number} n - The number of cards to deal.
 * @returns {string[]} An array of dealt cards.
 */
function deal(deck, n) {
    return deck.splice(0, n);
}


// --- Hand Evaluation Logic ---

/**
 * Parses a card string (e.g., 'K♠') into an object with rank, suit, and value.
 * @param {string} card - The card string.
 * @returns {{rank: string, suit: string, value: number}}
 */
function parseCard(card) {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    return { rank, suit, value: RANK_VALUES[rank] };
}

/**
 * Finds the best possible 5-card hand from a set of 7 cards (2 hole + 5 community).
 * @param {string[]} sevenCards - The player's 2 hole cards and the 5 community cards.
 * @returns {object} The best hand object, containing details about its rank and value.
 */
function getBestHand(sevenCards) {
    const allCombinations = getCombinations(sevenCards, 5);
    let bestHand = { rank: HAND_RANKS.HIGH_CARD, values: [0], name: "High Card", handCards: [] };

    for (const combo of allCombinations) {
        const evaluatedHand = evaluateHand(combo);
        if (compareHands(evaluatedHand, bestHand) > 0) {
            bestHand = evaluatedHand;
        }
    }
    return bestHand;
}

/**
 * Evaluates a 5-card hand and determines its rank (e.g., Flush, Straight, Pair).
 * @param {string[]} fiveCards - An array of 5 card strings.
 * @returns {object} An object describing the hand's rank, value, and name.
 */
function evaluateHand(fiveCards) {
    const parsedCards = fiveCards.map(parseCard).sort((a, b) => b.value - a.value);
    const values = parsedCards.map(c => c.value);
    const suits = parsedCards.map(c => c.suit);

    const isFlush = new Set(suits).size === 1;
    // Check for Ace-low straight (A, 2, 3, 4, 5)
    const isWheel = values.join(',') === '14,5,4,3,2';
    const isStraight = parsedCards.every((c, i) => i === 0 || values[i-1] - values[i] === 1) || isWheel;

    // Handle Straight Flush and Royal Flush
    if (isStraight && isFlush) {
        const highCardValue = isWheel ? 5 : values[0];
        const rank = (highCardValue === 14) ? HAND_RANKS.ROYAL_FLUSH : HAND_RANKS.STRAIGHT_FLUSH;
        return { rank, values: [highCardValue], name: HAND_RANK_NAMES[rank], handCards: fiveCards };
    }

    // Count rank occurrences (e.g., how many Kings, how many 7s)
    const valueCounts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    const counts = Object.values(valueCounts);
    const primaryValues = Object.keys(valueCounts).map(Number).sort((a, b) => {
        // Sort by count first, then by card value
        if (valueCounts[a] !== valueCounts[b]) {
            return valueCounts[b] - valueCounts[a];
        }
        return b - a;
    });

    // Handle Four of a Kind, Full House, etc.
    if (counts.includes(4)) {
        return { rank: HAND_RANKS.FOUR_OF_A_KIND, values: primaryValues, name: "Four of a Kind", handCards: fiveCards };
    }
    if (counts.includes(3) && counts.includes(2)) {
        return { rank: HAND_RANKS.FULL_HOUSE, values: primaryValues, name: "Full House", handCards: fiveCards };
    }
    if (isFlush) {
        return { rank: HAND_RANKS.FLUSH, values: values, name: "Flush", handCards: fiveCards };
    }
    if (isStraight) {
        const highCardValue = isWheel ? 5 : values[0];
        return { rank: HAND_RANKS.STRAIGHT, values: [highCardValue], name: "Straight", handCards: fiveCards };
    }
    if (counts.includes(3)) {
        return { rank: HAND_RANKS.THREE_OF_A_KIND, values: primaryValues, name: "Three of a Kind", handCards: fiveCards };
    }
    if (counts.filter(c => c === 2).length === 2) {
        return { rank: HAND_RANKS.TWO_PAIR, values: primaryValues, name: "Two Pair", handCards: fiveCards };
    }
    if (counts.includes(2)) {
        return { rank: HAND_RANKS.ONE_PAIR, values: primaryValues, name: "One Pair", handCards: fiveCards };
    }

    // Default to High Card
    return { rank: HAND_RANKS.HIGH_CARD, values: values, name: "High Card", handCards: fiveCards };
}

/**
 * Compares two evaluated hands to see which is better.
 * @param {object} handA - The first evaluated hand object.
 * @param {object} handB - The second evaluated hand object.
 * @returns {number} > 0 if handA wins, < 0 if handB wins, 0 for a tie.
 */
function compareHands(handA, handB) {
    if (handA.rank !== handB.rank) {
        return handA.rank - handB.rank;
    }
    // If ranks are the same, compare kickers
    for (let i = 0; i < handA.values.length; i++) {
        if (handA.values[i] !== handB.values[i]) {
            return handA.values[i] - handB.values[i];
        }
    }
    return 0; // It's a tie
}

/**
 * Helper function to generate all combinations of k items from an array.
 * Used to find all possible 5-card hands from 7 cards.
 * @param {Array} arr - The source array.
 * @param {number} k - The size of the combination.
 * @returns {Array<Array>} An array of all combinations.
 */
function getCombinations(arr, k) {
    const result = [];
    function combine(startIndex, currentCombo) {
        if (currentCombo.length === k) {
            result.push([...currentCombo]);
            return;
        }
        for (let i = startIndex; i < arr.length; i++) {
            currentCombo.push(arr[i]);
            combine(i + 1, currentCombo);
            currentCombo.pop();
        }
    }
    combine(0, []);
    return result;
}


// --- NPC AI Logic ---

/**
 * Determines the action for an NPC based on their hand strength and game state.
 * This provides more realistic behavior than random actions.
 * @param {object} player - The NPC player object.
 * @param {string[]} communityCards - The current community cards on the table.
 * @param {number} currentBet - The current amount to call.
 * @param {number} pot - The total size of the pot.
 * @returns {{action: string, amount: number}} The NPC's chosen action and bet amount.
 */
function getNpcDecision(player, communityCards, currentBet, pot) {
    const sevenCards = player.hand.concat(communityCards);
    const bestHand = getBestHand(sevenCards);
    const handStrength = bestHand.rank;

    const betToPotRatio = currentBet / (pot + 1); // Avoid division by zero

    // Pre-flop logic (no community cards yet)
    if (communityCards.length === 0) {
        const highCard = Math.max(RANK_VALUES[player.hand[0].slice(0, -1)], RANK_VALUES[player.hand[1].slice(0, -1)]);
        const isPair = player.hand[0].slice(0, -1) === player.hand[1].slice(0, -1);

        if (isPair && highCard > 8) { // Pair of 9s or better
            return { action: 'raise', amount: currentBet * 2 };
        }
        if (highCard > 11) { // Two high cards (Q, K, A)
            return { action: 'call', amount: currentBet };
        }
        if (currentBet > 0) {
            return { action: 'fold' }; // Fold weak hands to a bet
        }
        return { action: 'check' };
    }

    // Post-flop logic
    // Aggressive if hand is strong
    if (handStrength >= HAND_RANKS.TWO_PAIR) {
        if (Math.random() < 0.8) { // 80% chance to be aggressive
             return { action: 'raise', amount: Math.min(player.chips, pot / 2) };
        }
        return { action: 'call', amount: currentBet };
    }

    // Cautious with medium-strength hands
    if (handStrength >= HAND_RANKS.ONE_PAIR) {
        if (betToPotRatio > 0.5 && Math.random() < 0.6) { // 60% chance to fold to a big bet
            return { action: 'fold' };
        }
        return { action: 'call', amount: currentBet };
    }

    // Passive/Bluffing with weak hands
    if (handStrength < HAND_RANKS.ONE_PAIR) {
        // Occasional bluff
        if (Math.random() < 0.1 && currentBet === 0) { // 10% chance to bluff if no one has bet
            return { action: 'bet', amount: pot / 3 };
        }
        if (currentBet > 0) {
            return { action: 'fold' }; // Fold to any bet
        }
        return { action: 'check' };
    }
    
    // Default fallback
    return { action: 'check' };
}
