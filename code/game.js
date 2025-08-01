document.addEventListener("DOMContentLoaded", function () {
  const playBtn = document.getElementById("music-toggle-on");
  const pauseBtn = document.getElementById("music-toggle-off");
  const audio = document.getElementById("background-music");

  playBtn.addEventListener("click", function () {
    audio.play().catch(error => {
      console.error("Audio play failed:", error);
    });
    playBtn.style.display = "none";
    pauseBtn.style.display = "block";
    updateBackground(gameState.currentLocation);
  });
  pauseBtn.addEventListener("click", function () {
    audio.pause();
    // No need for .catch() here, just pause
    playBtn.style.display = "block";
    pauseBtn.style.display = "none";
    updateBackground(gameState.currentLocation);
  });
});

// --- Background Logic ---
function updateBackground(locationId) {
    const body = document.body;
    const musicIsOn = document.getElementById('music-toggle-off').style.display === 'block';

    // Clear any existing background classes first
    body.classList.remove('bg-outskirts', 'bg-town', 'bg-indoors');

    track = document.getElementById('background-music').getAttribute('src');
    

    // Only apply a new class if music is on
    if (musicIsOn) {
        if (track !== 'western.mp3') {
            document.getElementById('background-music').setAttribute('src', 'western.mp3');
            document.getElementById('background-music').play();
        }
        switch (locationId) {
            case 'sligo_outskirts':
                body.classList.add('bg-outskirts');
                break;
            case 'sligo_main_road':
                body.classList.add('bg-town');
                break;
            case 'saloon_main_room':
                if (track !== 'Saloon.mp3') {
                    document.getElementById('background-music').setAttribute('src', 'Saloon.mp3');
                    document.getElementById('background-music').play();
                } 
                body.classList.add('bg-indoors');
                break;
            case 'general_store':
                body.classList.add('bg-indoors');
                break;
        }
    }

}

// --- Poker Logic (from poker.js) ---
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



// --- Game Logic (from game.js) ---
const outputElement = document.getElementById('output');
const inputElement = document.getElementById('terminal-input');

let gameState = {
    currentLocation: 'sligo_outskirts',
    inventory: [],
    isGameRunning: false,
    pokerGame: {
        isGameActive: false,
        players: [],
        communityCards: [],
        deck: [],
        bettingRound: 0,
        pot: 0,
        currentPlayerIndex: 0
    }
};

function appendToOutput(text, className = 'game-message') {
    const paragraph = document.createElement('p');
    paragraph.classList.add(className, 'fade-in');
    paragraph.textContent = text;
    outputElement.appendChild(paragraph);
    outputElement.scrollTop = outputElement.scrollHeight;
}

function startGame() {
    if (gameState.isGameRunning) return;
    gameState.isGameRunning = true;
    resetLoop("You come awake atop your hungry horse. The town lies before you, a gritty collection of wooden buildings. To the east is the main road into town. Everywhere else is a nasty fall into Gunslinger Loop");
    
}

function displayLocation() {
    const location = locations[gameState.currentLocation];
    appendToOutput(location.description, "story-text");
    if (location.actions && location.actions.length > 0) {
        appendToOutput("You can: " + location.actions.join(', ') + ".", "command-help");
    }
    appendToOutput("Type 'help' to see available commands.", "command-help");
    
    updateBackground(gameState.currentLocation);
}

function resetLoop(message) {
    outputElement.innerHTML = ''; // Clear previous output
    document.getElementById('background-music').currentTime = 0;
    
    appendToOutput("Gunslinger Loop", "story-text");
    appendToOutput("-------------------------", "story-text");
    appendToOutput("You wake up again. The dust tastes the same, and the sun hangs in the same spot. It's a different  town. The same story.", "story-text");
    

    appendToOutput(message, "error-message");
    appendToOutput("The loop resets.", "game-message");
    gameState.currentLocation = 'sligo_outskirts';
    gameState.inventory = [];
    gameState.pokerGame.isGameActive = false;
    displayLocation();
    inputElement.disabled = false;
}

function processCommand(command) {
    if (!gameState.isGameRunning) {
        appendToOutput("Game is not running. Refresh to start.", "error-message");
        return;
    }

    appendToOutput(`> ${command}`, "command-history-item");

    let normalizedCommand = command.toLowerCase().trim();
    if (commandAliases[normalizedCommand]) {
        normalizedCommand = commandAliases[normalizedCommand];
    }

    const parts = normalizedCommand.split(' ');
    const verb = parts[0];
    const noun = parts.slice(1).join(' ');

    const currentLocation = locations[gameState.currentLocation];

    if (gameState.pokerGame.isGameActive) {
        handlePokerCommands(verb, noun);
        return;
    }

    switch (verb) {
        case 'go':
            handleGoCommand(noun, currentLocation);
            break;
        case 'look':
            handleLookCommand(currentLocation);
            break;
        case 'examine':
            handleExamineCommand(noun, currentLocation);
            break;
        case 'get':
        case 'take':
            handleGetCommand(noun, currentLocation);
            break;
        case 'inventory':
            handleInventoryCommand();
            break;
        case 'help':
            handleHelpCommand();
            break;
        case 'play':
            handlePlayCommand(noun, currentLocation);
            break;
        case 'I QUIT':
            handleQuitCommand();
            break;
        case 'die':
            handleDieCommand(currentLocation);
            break;
        case 'drink':
            handleDrinkCommand(noun, currentLocation);
            break;
        default:
            appendToOutput(`I don't understand that command: '${command}'.`, "error-message");
            break;
    }
}

function handleGoCommand(direction, currentLocation) {
    if (currentLocation.exits[direction]) {
        if (direction === 'west' && gameState.currentLocation === 'saloon_main_room') {
            if (gameState.inventory.includes('tarnished coin')) {
                appendToOutput("You insert the tarnished coin into a slot in the cellar door. The lock clicks open with a hollow sound.", "game-message");
                gameState.currentLocation = 'cellar_door';
                displayLocation();
                
            } else {
                appendToOutput("The cellar door is locked with a strange mechanism. You need a key or a token to open it.", "error-message");
            }
        } else {
            gameState.currentLocation = currentLocation.exits[direction];
            displayLocation();
        }
    } else {
        appendToOutput("You can't go that way.", "error-message");
    }
}

function handleLookCommand(currentLocation) {
    displayLocation();
    if (currentLocation.items.length > 0) {
        appendToOutput("You also see: " + currentLocation.items.join(', ') + ".", "command-help");
    }
}

function handleExamineCommand(item, currentLocation) {
    if (currentLocation.items.includes(item)) {
        if (item === 'poker table') {
            appendToOutput("The poker table is surrounded by figures who look hauntingly familiar, as if you've seen them in a different life. The chips are glowing with a sickly green light.", "story-text");
        } else if (item === 'strange concoction') {
            appendToOutput("A bottle of dark, swirling liquid. It smells faintly of sulphur.", "story-text");
        } else if (item === 'tarnished coin') {
            appendToOutput("A heavy, iron coin, encrusted with rust. It looks like it might fit a slot somewhere in this building.", "story-text");
        } else if (item === 'cellar door') {
            appendToOutput("A heavy, iron door with a strange coin slot. It's too sturdy to break open.", "story-text");
        } else if (item === 'general store') {
            appendToOutput("The general store is full of strange goods. The proprietor looks like he's seen a thing or two.", "story-text");
        } else if (item === 'gnome') {
            appendToOutput("The gnome proprietor has a long, white beard and a surprisingly cheerful disposition for this place.", "story-text");
        } else if (item === 'strange trinkets') {
            appendToOutput("These trinkets look like they're from another dimension. They're not for sale... yet.", "story-text");
        }
    } else if (gameState.inventory.includes(item)) {
        appendToOutput(`You already have the ${item} in your inventory.`, "story-text");
    } else {
        appendToOutput(`There is no '${item}' here to examine.`, "error-message");
    }
}

function handleGetCommand(item, currentLocation) {
    const itemIndex = currentLocation.items.indexOf(item);
    if (itemIndex > -1) {
        if (item === 'poker table' || item === 'cellar door' || item === 'general store' || item === 'gnome') {
            appendToOutput(`You can't take the ${item}. It's a permanent part of this place.`, "error-message");
        } else {
            gameState.inventory.push(currentLocation.items.splice(itemIndex, 1)[0]);
            appendToOutput(`You take the ${item}. It is now in your inventory.`, "game-message");
        }
    } else {
        appendToOutput(`There is no '${item}' here to take.`, "error-message");
    }
}

function handleInventoryCommand() {
    if (gameState.inventory.length > 0) {
        appendToOutput("Your inventory contains: " + gameState.inventory.join(', '), "game-message");
    } else {
        appendToOutput("Your inventory is empty.", "game-message");
    }
}

function handleHelpCommand() {
    appendToOutput("Available commands:", "command-help");
    appendToOutput(" - go [direction] (e.g., 'go north' or 'n')", "command-help");
    appendToOutput(" - look (or 'l')", "command-help");
    appendToOutput(" - examine [item] (or 'x')", "command-help");
    appendToOutput(" - get [item] (or 'take')", "command-help");
    appendToOutput(" - inventory (or 'i')", "command-help");
    appendToOutput(" - play poker (in the saloon)", "command-help");
    appendToOutput(" - drink [item] (e.g., 'drink strange concoction')", "command-help");
    appendToOutput(" - help (or 'h')", "command-help");
    appendToOutput(" - die (or 'end it')", "command-help");
    appendToOutput(" - I QUIT (or 'exit')", "command-help");
}

function handlePlayCommand(item, currentLocation) {
    if (item === 'poker' && currentLocation.items.includes('poker table')) {
        appendToOutput("You sit down at the glowing poker table, facing a grim-faced dealer and two other players.", "game-message");
        gameState.pokerGame.isGameActive = true;
        startPokerGame();
    } else {
        appendToOutput("You can't play poker here.", "error-message");
    }
}

function handleQuitCommand() {
    resetLoop("You feel a cold jolt, a flash of something sharp and quick. And then, you're back on your horse, the town of Sligo before you once more.");
}

function handleDieCommand(currentLocation) {
    const message = deathMessages[gameState.currentLocation] || "You feel your will to go on fade, and the world dissolves into darkness.";
    resetLoop(message);
}

function handleDrinkCommand(item, currentLocation) {
    if (item === 'strange concoction' && currentLocation.items.includes('strange concoction')) {
        const success = Math.random() > 0.5;
        if (success) {
            appendToOutput("The concoction tastes of rust and copper. A strange vision flashes before your eyes—a hidden symbol on the cellar floor. You feel a new resolve.", "game-message");
            const itemIndex = currentLocation.items.indexOf('strange concoction');
            if (itemIndex > -1) {
                 currentLocation.items.splice(itemIndex, 1);
            }
        } else {
            resetLoop("You drink the strange concoction. Your head spins, your vision blurs, and the world shatters into a million pieces.");
        }
    } else {
        appendToOutput(`You can't drink the ${item}.`, "error-message");
    }
}

function startPokerGame() {
    gameState.pokerGame.deck = createDeck();
    shuffle(gameState.pokerGame.deck);

    gameState.pokerGame.players = [
        { name: "You", hand: [], isFolded: false, isPlayer: true },
        { name: "Dealer", hand: [], isFolded: false, isPlayer: false },
        { name: "The Jackal", hand: [], isFolded: false, isPlayer: false },
        { name: "Vex", hand: [], isFolded: false, isPlayer: false }
    ];

    gameState.pokerGame.pot = 0;
    gameState.pokerGame.communityCards = [];
    gameState.pokerGame.bettingRound = 0;

    gameState.pokerGame.players.forEach(player => {
        player.hand = deal(gameState.pokerGame.deck, 2);
    });

    appendToOutput("The dealer deals the cards.", "game-message");
    appendToOutput(`Your hand: ${gameState.pokerGame.players[0].hand.join(', ')}`, "game-message");
    appendToOutput("The others' hands are hidden.", "game-message");

    gameState.pokerGame.currentPlayerIndex = 0;
    promptForPokerAction();
}

function promptForPokerAction() {
    const activePlayers = gameState.pokerGame.players.filter(p => !p.isFolded);
    if (activePlayers.length <= 1) {
        endPokerRound();
        return;
    }

    let playerTurn = gameState.pokerGame.players[gameState.pokerGame.currentPlayerIndex];
    if (playerTurn.isFolded) {
        nextPokerTurn();
        return;
    }

    if (playerTurn.isPlayer) {
        appendToOutput("What is your action? (Commands: check, bet [amount], call, raise [amount], fold)", "command-help");
    } else {
        npcPokerAction(playerTurn);
    }
}

function npcPokerAction(player) {
    const action = Math.random() < 0.5 ? 'check' : 'fold';
    appendToOutput(`${player.name} decides to ${action}.`, "game-message");

    if (action === 'fold') {
        player.isFolded = true;
    }

    nextPokerTurn();
}

function nextPokerTurn() {
    gameState.pokerGame.currentPlayerIndex = (gameState.pokerGame.currentPlayerIndex + 1) % gameState.pokerGame.players.length;

    if (gameState.pokerGame.currentPlayerIndex === 0) {
        progressPokerGame();
    } else {
        promptForPokerAction();
    }
}

function progressPokerGame() {
    gameState.pokerGame.bettingRound++;
    switch (gameState.pokerGame.bettingRound) {
        case 1:
            gameState.pokerGame.communityCards = deal(gameState.pokerGame.deck, 3);
            appendToOutput(`The Flop is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        case 2:
            gameState.pokerGame.communityCards = gameState.pokerGame.communityCards.concat(deal(gameState.pokerGame.deck, 1));
            appendToOutput(`The Turn is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        case 3:
            gameState.pokerGame.communityCards = gameState.pokerGame.communityCards.concat(deal(gameState.pokerGame.deck, 1));
            appendToOutput(`The River is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        default:
            endPokerRound();
            return;
    }
    gameState.pokerGame.currentPlayerIndex = 0;
    promptForPokerAction();
}

function endPokerRound() {
    appendToOutput("All cards are revealed!", "game-message");
    gameState.pokerGame.players.forEach(player => {
        appendToOutput(`${player.name}'s hand: ${player.hand.join(', ')}`, "game-message");
    });

    const winner = gameState.pokerGame.players.find(p => !p.isFolded);
    if (winner) {
         appendToOutput(`${winner.name} wins the pot! (Winning condition not fully implemented)`, "game-message");
    } else {
         appendToOutput("Everyone folded. The game is over.", "game-message");
    }

    gameState.pokerGame.isGameActive = false;
    appendToOutput("The round is over. You get up from the table.", "game-message");
    displayLocation();
}

function handlePokerCommands(verb, noun) {
    const player = gameState.pokerGame.players[0];

    if (player.isFolded) {
         appendToOutput("You have already folded this round.", "error-message");
         return;
    }

    switch (verb) {
        case 'check':
            appendToOutput("You check.", "game-message");
            nextPokerTurn();
            break;
        case 'bet':
        case 'raise':
            const amount = parseInt(noun, 10);
            if (isNaN(amount) || amount <= 0) {
                appendToOutput("You must bet a positive number of chips.", "error-message");
                return;
            }
            appendToOutput(`You ${verb} ${amount} chips.`, "game-message");
            nextPokerTurn();
            break;
        case 'call':
            appendToOutput("You call.", "game-message");
            nextPokerTurn();
            break;
        case 'fold':
            appendToOutput("You fold your hand and get up from the table.", "game-message");
            player.isFolded = true;
            endPokerRound();
            break;
        default:
            appendToOutput(`I don't understand that poker command. Try 'check', 'bet [amount]', 'call', 'raise [amount]', or 'fold'.`, "error-message");
            break;
    }
}

// --- Event Listeners and Initial Setup ---
inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = inputElement.value;
        if (command.trim() !== '') {
            processCommand(command);
            inputElement.value = ''; // Clear input
        }
    }
});

// Start the game when the page is loaded
window.onload = startGame;
