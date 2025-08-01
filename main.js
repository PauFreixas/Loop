// This file is a bundled version of game.js, poker.js, and story.js
// All import/export statements have been removed.

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

// --- Story Elements ---
const locations = {
    sligo_outskirts: {
        description: "You come awake atop your hungry horse. The town lies before you, a gritty collection of wooden buildings. To the east is the main road into town. Everywhere else is a nasty fall into Gunslinger Loop",
        exits: {
            east: 'sligo_main_road'
        },
        items: [],
        actions: ['go east','die']
    },
    sligo_main_road: {
        description: "The main road is a wide sandy path flanked by various establishments. To the west, you can see the outskirts of town where your horse waits. To the north is the notorious Brimstone Bar, and to the south is the general store.",
        exits: {
            west: 'sligo_outskirts',
            north: 'saloon_main_room',
            south: 'general_store'
        },
        items: ['general store'],
        actions: ['go north (to Brimstone Bar)','examine general store', 'die']
    },
    saloon_main_room: {
        description: "You're in the main room of the Brimstone Bar. The air is thick with the smell of stale whiskey and something else—something akin to forgotten memories. The patrons at the tables have faces that feel hauntingly familiar, as if you've seen them in a different life. A long, smoky bar runs along the north wall. The back alley is to the east, and a mysterious cellar door is on the floor to the west. A bustling main road leads south.",
        exits: {
            east: 'back_alley',
            north: 'bar',
            west: 'cellar_door',
            south: 'sligo_main_road'
        },
        items: ['poker table'],
        actions: ['examine poker table', 'look at patrons', 'play poker', 'die']
    },
    bar: {
        description: "The bar is made of what looks like polished obsidian. Behind it, a bartender with glowing red eyes polishes a chalice. There are a few bottles of strange concoctions on the shelves. The main room is back to the south.",
        exits: {
            south: 'saloon_main_room'
        },
        items: ['strange concoction'],
        actions: ['get strange concoction', 'talk to bartender', 'drink strange concoction', 'die']
    },
    back_alley: {
        description: "The alley is dark and grimy. A discarded, tarnished coin lies in a puddle of something that sizzles when you get close. The main room is back to the west.",
        exits: {
            west: 'saloon_main_room'
        },
        items: ['tarnished coin'],
        actions: ['get tarnished coin', 'die']
    },
    cellar_door: {
        description: "A heavy, iron door is set into the floor. It's locked. The main room is back to the east.",
        exits: {
            east: 'saloon_main_room'
        },
        items: ['cellar door'],
        actions: ['unlock door', 'die']
    },
    general_store: {
        description: "The general store is a chaotic mess of goods. Shelves are lined with strange, otherworldly items. An old, gnomish-looking proprietor with a long beard and a friendly grin stands behind the counter. The main road is to the north.",
        exits: {
            north: 'sligo_main_road'
        },
        items: ['gnome', 'strange trinkets'],
        actions: ['talk to gnome', 'examine strange trinkets', 'die']
    }
};

const deathMessages = {
    sligo_outskirts: "You step off the cliff edge, plummeting into an satirically well named chasm.",
    sligo_main_road: "A wild-eyed stranger on a passing carriage draws his pistol and fires. You feel a searing pain before the world dissolves.",
    saloon_main_room: "You draw your own big iron from the hip and challenge the entire room. One shot you release but twenty come back at you.",
    bar: "The bartender simply stares at you. His eyes glow brighter, and you feel your essence drain away into the polished obsidian bar.",
    back_alley: "You slip and fall head-first into the sizzling puddle. The last thing you see is the tarnished coin floating above you.",
    cellar_door: "You try to pry the heavy iron door open with your bare hands, and it snaps shut on your fingers. The pain is too much. You fall into darkness.",
    general_store: "You try to rob the gnome proprietor. He simply sighs, and a strange wave of energy hits you. You feel yourself turning to stone."
};

const commandAliases = {
    'n': 'go north', 's': 'go south', 'e': 'go east', 'w': 'go west',
    'i': 'inventory', 'x': 'examine', 'l': 'look', 'h': 'help',
    'take': 'get', 'pick up': 'get', 'end it': 'die', 'exit': 'I QUIT',
};


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
    appendToOutput("Gunslinger Loop", "story-text");
    appendToOutput("-------------------------", "story-text");
    appendToOutput("You wake up again. The dust tastes the same, and the sun hangs in the same spot. It's a different  town. The same story.", "story-text");
    displayLocation();
}

function displayLocation() {
    appendToOutput("Type 'help' to see available commands.", "command-help");
    const location = locations[gameState.currentLocation];
    appendToOutput(location.description, "story-text");
    if (location.actions && location.actions.length > 0) {
        appendToOutput("You can: " + location.actions.join(', ') + ".", "command-help");
    }
}

function resetLoop(message) {
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
