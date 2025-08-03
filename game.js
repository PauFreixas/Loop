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
    playBtn.style.display = "block";
    pauseBtn.style.display = "none";
    updateBackground(gameState.currentLocation);
  });
});

// --- Background Logic ---
function updateBackground(locationId) {
    const body = document.body;
    const musicIsOn = document.getElementById('music-toggle-off').style.display === 'block';

    body.classList.remove('bg-outskirts', 'bg-town', 'bg-indoors');

    let track = document.getElementById('background-music').getAttribute('src');

    if (musicIsOn) {
        if (locationId === 'saloon_main_room' || locationId === 'bar' ) {
            if (track !== 'Saloon.mp3') {
                document.getElementById('background-music').setAttribute('src', 'Saloon.mp3');
                document.getElementById('background-music').play();
            }
            body.classList.add('bg-indoors');
        } else {
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
                case 'general_store':
                    body.classList.add('bg-indoors');
                    break;
            }
        }
    }
}


// --- Game Logic ---
const outputElement = document.getElementById('output');
const inputElement = document.getElementById('terminal-input');
const moneyDisplayElement = document.getElementById('money-display');

const initialLocations = JSON.parse(JSON.stringify(locations));

let gameState = {
    currentLocation: 'sligo_outskirts',
    worldState: {},
    inventory: [],
    money: 0,
    isGameRunning: false,
    loopTracker: 0,
    visitedLocations: new Set(),
    pokerGame: {
        isGameActive: false,
        players: [],
        communityCards: [],
        deck: [],
        bettingRound: 0,
        pot: { chips: 0, items: [] },
        currentBet: 0,
        currentPlayerIndex: 0,
        dealerButtonIndex: 0,
        itemWageredThisRound: false
    }
};

function appendToOutput(text, className = 'game-message') {
    const paragraph = document.createElement('p');
    paragraph.classList.add(className, 'fade-in');
    paragraph.textContent = text;
    outputElement.appendChild(paragraph);
    outputElement.scrollTop = outputElement.scrollHeight;
}

function updateMoneyUI(amount) {
    if (amount > 0) {
        moneyDisplayElement.textContent = `$${amount}`;
        moneyDisplayElement.style.display = 'block';
    } else {
        moneyDisplayElement.style.display = 'none';
    }
}

function startGame() {
    if (gameState.isGameRunning) return;
    gameState.isGameRunning = true;
    resetLoop("You come awake atop your horse, at the edge of the chasm that is Gunslinger Loop.");
}

function displayLocation() {
    const location = gameState.worldState[gameState.currentLocation];
    appendToOutput(location.description, "story-text");
    
    updateBackground(gameState.currentLocation);
    
}

function clearOutput() {
    outputElement.innerHTML = '';
}

function toSimpleRoman(num) {
  let result = "";
  result += "M".repeat(Math.floor(num / 1000));
  num %= 1000;
  result += "C".repeat(Math.floor(num / 100));
  num %= 100;
  result += "X".repeat(Math.floor(num / 10));
  num %= 10;
  result += "I".repeat(num);
  return result;
}

function getLoopCounter () {
    return toSimpleRoman(gameState.loopTracker);
}

function applyLoopChanges() {
    // Add new choices or events based on the loop number
    if (gameState.loopTracker === 2) {
        gameState.worldState.bar.actions.push('ask about the loop');
        appendToOutput("A strange sense of deja vu washes over you. You feel like you've learned something.", "story-text");
    }
    if (gameState.loopTracker === 3) {
        gameState.worldState.general_store.items.push('glowing rock');
        appendToOutput("The world feels slightly different this time. A new energy emanates from the General Store.", "story-text");
    }
}

function resetLoop(message) {
    applyLoopChanges();
    clearOutput();
    document.getElementById('background-music').currentTime = 0;
    const loopCounter = getLoopCounter();
    appendToOutput("Gunslinger Loop " + loopCounter, "story-text");
    appendToOutput("-------------------------", "story-text");
    gameState.loopTracker++;
    appendToOutput(message, "error-message");
    
    gameState.worldState = JSON.parse(JSON.stringify(initialLocations));
    
    gameState.currentLocation = 'sligo_outskirts';
    gameState.visitedLocations.add('sligo_outskirts');
    
    gameState.inventory = [];
    gameState.money = 0;
    updateMoneyUI(0);
    gameState.pokerGame.isGameActive = false;
    displayLocation();
    appendToOutput("Your pockets are empty, the frontier lies unbothered before you.");
    displayAvailableCommands();
    inputElement.disabled = false;
}

function displayAvailableCommands() {
    output = getAvailableCommands();
    appendToOutput("Available commands: " + output, "command-help");
}

/**
 * Gathers all available commands based on the current game state.
 * @returns {string[]} An array of command strings.
 */
function getAvailableCommands() {
    // Use a Set to automatically handle duplicate commands
    const commands = new Set();
    const currentLocation = gameState.worldState[gameState.currentLocation];

    // If in a poker game, only return poker commands
    if (gameState.pokerGame.isGameActive) {
        ['check', 'bet [amount]', 'call', 'raise [amount]', 'wager [item]', 'fold'].forEach(cmd => commands.add(cmd));
        return Array.from(commands);
    }

    // --- Add commands based on context ---

    
    // 2. Movement commands from the current location's exits
    Object.keys(currentLocation.exits).forEach(exit => commands.add(`go ${exit}`));
    if (gameState.visitedLocations.size > 1) {
        commands.add('travel [location]');
    }

    // 3. Commands for items present in the location
    currentLocation.items.forEach(item => {
        if (!['poker table', 'cellar door', 'general store', 'gnome'].includes(item)) {
             commands.add(`get ${item}`);
        }
        commands.add(`examine ${item}`);
    });
    
    // 4. Location-specific commands
    if (gameState.currentLocation === 'saloon_main_room') {
        commands.add('examine cellar door');
        if (currentLocation.items.includes('poker table')) {
            commands.add('play poker');
        }
    }

    // 5. Commands based on items in player's inventory
    if (gameState.inventory.includes('tarnished coin') && gameState.currentLocation === 'bar') {
        commands.add('trade tarnished coin');
    }
    if (gameState.inventory.includes('strange concoction') && currentLocation.items.includes('strange concoction')) {
        commands.add('drink strange concoction');
    }

    // 6. Commands based on game progress (loop tracker)
    if (gameState.currentLocation === 'bar' && gameState.loopTracker >= 2) {
        commands.add('ask about the loop');
    }

    // Universal commands available everywhere
    ['die'].forEach(cmd => commands.add(cmd));


    // Convert the Set to an array and return it
    return Array.from(commands);
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

    if (gameState.pokerGame.isGameActive) {
        handlePokerCommands(verb, noun);
        return;
    }

    const currentLocation = gameState.worldState[gameState.currentLocation];

    switch (verb) {
        case 'go':
            handleGoCommand(noun, currentLocation);
            break;
        case 'look':
            handleLookCommand(currentLocation);
            break;
        case 'get':
        case 'take':
            handleGetCommand(noun, currentLocation);
            break;
        case 'play':
            handlePlayCommand(noun, currentLocation);
            break;
        case 'trade':
            handleTradeCommand(noun);
            break;
        case 'ask':
            handleAskCommand(noun);
            break;
        case 'quit':
            handleQuitCommand();
            break;
        case 'die':
            handleDieCommand();
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
        const nextLocation = currentLocation.exits[direction];
        gameState.currentLocation = nextLocation;
        gameState.visitedLocations.add(nextLocation);
        displayLocation();
        displayAvailableCommands();
    } else {
        appendToOutput("You can't go that way.", "error-message");
    }
}

function handleTravelCommand(noun) {
    const destinationId = Object.keys(locations).find(key => 
        locations[key] && locations[key].name && locations[key].name.toLowerCase() === noun);
    
    if (destinationId && gameState.visitedLocations.has(destinationId)) {
        gameState.currentLocation = destinationId;
        appendToOutput(`You travel to the ${locations[destinationId].name}.`, "game-message");
    
    } else {
        appendToOutput("You can't travel there. You either haven't discovered it or it doesn't exist.", "error-message");
    }
}

function handleLookCommand(currentLocation) {
    displayLocation();
    if (currentLocation.items.length > 0) {
        appendToOutput("You also see: " + currentLocation.items.join(', ') + ".", "command-help");
    }
    displayAvailableCommands();
}

function handleExamineCommand(item, currentLocation) {
    if (currentLocation.items.includes(item) || item === 'cellar door' && gameState.currentLocation === 'saloon_main_room') {
        if (item === 'poker table') {
            appendToOutput("The poker table is surrounded by figures who look hauntingly familiar. The chips glow with a sickly green light.", "story-text");
        } else if (item === 'strange concoction') {
            appendToOutput("A bottle of dark, swirling liquid. It smells faintly of sulphur.", "story-text");
        } else if (item === 'tarnished coin') {
            appendToOutput("A heavy, iron coin, encrusted with rust. It looks like it might fit a slot somewhere.", "story-text");
        } else if (item === 'cellar door') {
            appendToOutput("A heavy, iron door with a strange coin slot. It's too sturdy to break open.", "story-text");
        } else if (item === 'general store') {
            appendToOutput("The general store is full of strange goods. The proprietor looks like he's seen a thing or two.", "story-text");
        } else if (item === 'gnome') {
            appendToOutput("The gnome proprietor has a long, white beard and a surprisingly cheerful disposition.", "story-text");
        } else if (item === 'strange trinkets') {
            appendToOutput("These trinkets look like they're from another dimension. They're not for sale... yet.", "story-text");
        } else if (item === 'glowing rock') {
            appendToOutput("A smooth, grey rock that pulses with a faint, internal light. It feels warm to the touch.", "story-text");
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
        if (['poker table', 'cellar door', 'general store', 'gnome'].includes(item)) {
            appendToOutput(`You can't take the ${item}.`, "error-message");
        } else {
            gameState.inventory.push(currentLocation.items.splice(itemIndex, 1)[0]);
            appendToOutput(`You take the ${item}.`, "game-message");
        }
    } else {
        appendToOutput(`There is no '${item}' here to take.`, "error-message");
    }
}

function handleInventoryCommand() {
    let invMessage = "Your inventory is empty.";
    if (gameState.inventory.length > 0) {
        invMessage = "Your inventory contains: " + gameState.inventory.join(', ');
    }
    if (gameState.money > 0) {
        invMessage += `\nYou have $${gameState.money}.`;
    }
    appendToOutput(invMessage, "game-message");
}

function handleHelpCommand() {
    appendToOutput("Available commands:", "command-help");
    appendToOutput()
    appendToOutput(" - go [direction]", "command-help");
    appendToOutput(" - look", "command-help");
    appendToOutput(" - examine [item]", "command-help");
    appendToOutput(" - get [item]", "command-help");
    appendToOutput(" - trade [item] (at the bar)", "command-help");
    appendToOutput(" - inventory", "command-help");
    appendToOutput(" - play poker", "command-help");
    appendToOutput(" - drink [item]", "command-help");
    appendToOutput(" - die", "command-help");
}

function handlePlayCommand(item, currentLocation) {
    if (item === 'poker' && currentLocation.items.includes('poker table')) {
        if (gameState.money >= 10) {
            appendToOutput("You sit down at the glowing poker table, facing a grim-faced dealer and two other players.", "game-message");
            gameState.pokerGame.isGameActive = true;
            startPokerGame();
        } else {
            appendToOutput("You need at least $10 to join the game. The dealer won't let you sit. Maybe you can trade something of value at the bar.", "error-message");
        }
    } else {
        appendToOutput("You can't play poker here.", "error-message");
    }
}

function handleTradeCommand(item) {
    if (gameState.currentLocation !== 'bar') {
        appendToOutput("This isn't the place for trading. Try the bar.", "error-message");
        return;
    }
    if (item === 'tarnished coin' && gameState.inventory.includes('tarnished coin')) {
        const coinIndex = gameState.inventory.indexOf('tarnished coin');
        gameState.inventory.splice(coinIndex, 1);
        gameState.money += 1000;
        appendToOutput("You slide the tarnished coin to the bartender. He grunts and pushes a stack of $1000 your way.", "game-message");
        updateMoneyUI(gameState.money);
    } else {
        appendToOutput("You can't trade that here, or you don't have it.", "error-message");
    }
}

function handleAskCommand(noun) {
    if (noun === 'about the loop' && gameState.currentLocation === 'bar') {
        appendToOutput("You ask the bartender about the repeating day. He stops polishing the chalice and his glowing eyes fix on you. 'Some souls are too stubborn to pass on,' he rasps. 'They get stuck. Like a record skipping.' He gestures to the poker table. 'Some try to win their way out. Others just... fade.'", 'story-text');
    } else {
        appendToOutput("You can't ask about that here.", "error-message");
    }
}

function handleQuitCommand() {
    resetLoop("You feel a cold jolt... and then, you're back on your horse, the town of Sligo before you once more.");
}

function handleDieCommand() {
    const message = deathMessages[gameState.currentLocation] || "You feel your will to go on fade, and the world dissolves into darkness.";
    resetLoop(message);
}

function handleDrinkCommand(item, currentLocation) {
    if (item === 'strange concoction' && currentLocation.items.includes('strange concoction')) {
        const success = Math.random() > 0.5;
        if (success) {
            appendToOutput("The concoction tastes of rust and copper. A strange vision flashes before your eyes—a hidden symbol on the cellar floor.", "game-message");
            const itemIndex = currentLocation.items.indexOf('strange concoction');
            if (itemIndex > -1) {
                 currentLocation.items.splice(itemIndex, 1);
            }
        } else {
            resetLoop("You drink the strange concoction. Your head spins, your vision blurs, and the world shatters.");
        }
    } else {
        appendToOutput(`You can't drink the ${item}.`, "error-message");
    }
}

// --- NEW AND UPDATED POKER FUNCTIONS ---

function startPokerGame() {
    gameState.pokerGame.deck = createDeck();
    shuffle(gameState.pokerGame.deck);
    
    gameState.pokerGame.dealerButtonIndex = (gameState.pokerGame.dealerButtonIndex + 1) % 4;
    gameState.pokerGame.itemWageredThisRound = false;

    gameState.pokerGame.players = [
        { name: "You", hand: [], isFolded: false, isPlayer: true, chips: gameState.money, lastAction: null },
        { name: "Dealer", hand: [], isFolded: false, isPlayer: false, chips: 1000, inventory: [], lastAction: null },
        { name: "The Jackal", hand: [], isFolded: false, isPlayer: false, chips: 1500, inventory: ['ornate gun'], lastAction: null },
        { name: "Vex", hand: [], isFolded: false, isPlayer: false, chips: 800, inventory: ['silver locket'], lastAction: null }
    ];

    gameState.pokerGame.pot = { chips: 0, items: [] };
    gameState.pokerGame.communityCards = [];
    gameState.pokerGame.bettingRound = 0;
    
    const smallBlind = 5;
    const bigBlind = 10;
    const sbIndex = (gameState.pokerGame.dealerButtonIndex + 1) % 4;
    const bbIndex = (gameState.pokerGame.dealerButtonIndex + 2) % 4;

    const sbPlayer = gameState.pokerGame.players[sbIndex];
    const bbPlayer = gameState.pokerGame.players[bbIndex];

    sbPlayer.chips -= smallBlind;
    bbPlayer.chips -= bigBlind;
    gameState.pokerGame.pot.chips = smallBlind + bigBlind;
    gameState.pokerGame.currentBet = bigBlind;

    appendToOutput(`The game begins. ${gameState.pokerGame.players[gameState.pokerGame.dealerButtonIndex].name} is the dealer.`, "game-message");
    appendToOutput(`${sbPlayer.name} posts the small blind of $${smallBlind}.`, "game-message");
    appendToOutput(`${bbPlayer.name} posts the big blind of $${bigBlind}.`, "game-message");
    
    gameState.pokerGame.players.forEach(player => {
        player.hand = deal(gameState.pokerGame.deck, 2);
    });

    appendToOutput("The dealer deals the cards.", "game-message");
    appendToOutput(`Your hand: ${gameState.pokerGame.players[0].hand.join(', ')}`, "game-message");
    appendToOutput(`Your money: $${gameState.pokerGame.players[0].chips}`, "game-message");
    
    gameState.pokerGame.currentPlayerIndex = (bbIndex + 1) % 4; 
    promptForPokerAction();
}

function promptForPokerAction() {
    const activePlayers = gameState.pokerGame.players.filter(p => !p.isFolded);
    if (activePlayers.length <= 1) {
        endPokerRound();
        return;
    }

    let playerTurn = gameState.pokerGame.players[gameState.pokerGame.currentPlayerIndex];
    if (playerTurn.isFolded || playerTurn.chips === 0) {
        nextPokerTurn();
        return;
    }

    if (playerTurn.isPlayer) {
        let potStatus = `Current pot: $${gameState.pokerGame.pot.chips}.`;
        if (gameState.pokerGame.pot.items.length > 0) {
            potStatus += ` Items in pot: ${gameState.pokerGame.pot.items.join(', ')}.`;
        }
        appendToOutput(potStatus, "game-message");
        appendToOutput(`Current bet to call: $${gameState.pokerGame.currentBet}.`, "game-message");
        appendToOutput("Actions: check, bet [amt], call, raise [amt], wager [item], fold", "command-help");
    } else {
        setTimeout(() => npcPokerAction(playerTurn), 1000);
    }
}

function npcPokerAction(player) {
    const sevenCards = player.hand.concat(gameState.pokerGame.communityCards);
    const handStrength = getBestHand(sevenCards).rank;

    if (!gameState.pokerGame.itemWageredThisRound && player.inventory && player.inventory.length > 0 && handStrength >= HAND_RANKS.TWO_PAIR) {
        const itemToWager = player.inventory.shift();
        gameState.pokerGame.pot.items.push(itemToWager);
        gameState.pokerGame.itemWageredThisRound = true;
        appendToOutput(`${player.name} smirks and throws their ${itemToWager} into the pot!`, 'game-message');
        nextPokerTurn();
        return;
    }

    const decision = getNpcDecision(player, gameState.pokerGame.communityCards, gameState.pokerGame.currentBet, gameState.pokerGame.pot.chips);
    let actionText = `${player.name} ${decision.action}s`;
    
    switch (decision.action) {
        case 'fold':
            player.isFolded = true;
            break;
        case 'call':
            const callAmount = Math.min(player.chips, gameState.pokerGame.currentBet);
            player.chips -= callAmount;
            gameState.pokerGame.pot.chips += callAmount;
            actionText = `${player.name} calls.`;
            break;
        case 'raise':
            const raiseAmount = Math.min(player.chips, decision.amount);
            player.chips -= raiseAmount;
            gameState.pokerGame.pot.chips += raiseAmount;
            gameState.pokerGame.currentBet = raiseAmount;
            actionText = `${player.name} raises to $${raiseAmount}.`;
            break;
        case 'bet':
            const betAmount = Math.min(player.chips, decision.amount);
            player.chips -= betAmount;
            gameState.pokerGame.pot.chips += betAmount;
            gameState.pokerGame.currentBet = betAmount;
            actionText = `${player.name} bets $${betAmount}.`;
            break;
        case 'check':
            actionText = `${player.name} checks.`;
            break;
    }
    appendToOutput(actionText, "game-message");
    nextPokerTurn();
}

function nextPokerTurn() {
    const activePlayers = gameState.pokerGame.players.filter(p => !p.isFolded);
    if (activePlayers.length <= 1) {
        endPokerRound();
        return;
    }
    
    const nextIndex = (gameState.pokerGame.currentPlayerIndex + 1) % gameState.pokerGame.players.length;
    
    // Simplified end-of-round check
    if (nextIndex === (gameState.pokerGame.dealerButtonIndex + 1) % 4 && gameState.pokerGame.bettingRound > 0) {
        progressPokerGame();
    } else {
        gameState.pokerGame.currentPlayerIndex = nextIndex;
        promptForPokerAction();
    }
}

function progressPokerGame() {
    gameState.pokerGame.bettingRound++;
    gameState.pokerGame.currentBet = 0;
    gameState.pokerGame.players.forEach(p => p.lastAction = null);

    switch (gameState.pokerGame.bettingRound) {
        case 1:
            gameState.pokerGame.communityCards.push(...deal(gameState.pokerGame.deck, 3));
            appendToOutput(`The Flop is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        case 2:
            gameState.pokerGame.communityCards.push(...deal(gameState.pokerGame.deck, 1));
            appendToOutput(`The Turn is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        case 3:
            gameState.pokerGame.communityCards.push(...deal(gameState.pokerGame.deck, 1));
            appendToOutput(`The River is dealt: ${gameState.pokerGame.communityCards.join(', ')}`, "game-message");
            break;
        default:
            endPokerRound();
            return;
    }
    gameState.pokerGame.currentPlayerIndex = (gameState.pokerGame.dealerButtonIndex + 1) % 4; 
    promptForPokerAction();
}

function endPokerRound() {
    appendToOutput("--- Round Over ---", "story-text");
    const community = gameState.pokerGame.communityCards;
    
    let activePlayers = gameState.pokerGame.players.filter(p => !p.isFolded);
    let winners = [];
    let bestHandInfo = null;

    if (activePlayers.length === 1) {
        winners = activePlayers;
    } else {
        appendToOutput("Showdown! Cards are revealed.", "game-message");
        activePlayers.forEach(player => {
            const sevenCards = player.hand.concat(community);
            player.bestHand = getBestHand(sevenCards);
            appendToOutput(`${player.name} has: ${player.hand.join(', ')} (Best hand: ${player.bestHand.name})`, "game-message");
            
            if (!bestHandInfo) {
                bestHandInfo = player.bestHand;
                winners = [player];
            } else {
                const comparison = compareHands(player.bestHand, bestHandInfo);
                if (comparison > 0) {
                    bestHandInfo = player.bestHand;
                    winners = [player];
                } else if (comparison === 0) {
                    winners.push(player);
                }
            }
        });
    }
    
    if (winners.length > 0) {
        const winnerNames = winners.map(w => w.name).join(' and ');
        const chipWinnings = Math.floor(gameState.pokerGame.pot.chips / winners.length);
        winners.forEach(winner => {
            winner.chips += chipWinnings;
        });
        appendToOutput(`${winnerNames} win(s) the pot of $${gameState.pokerGame.pot.chips}!`, "game-message");

        if (gameState.pokerGame.pot.items.length > 0) {
            const itemWinnings = gameState.pokerGame.pot.items;
            const itemWinner = winners[0];
            if (itemWinner.isPlayer) {
                gameState.inventory.push(...itemWinnings);
            } else {
                if (!itemWinner.inventory) itemWinner.inventory = [];
                itemWinner.inventory.push(...itemWinnings);
            }
            appendToOutput(`${itemWinner.name} also collects the wagered items: ${itemWinnings.join(', ')}!`, 'game-message');
        }
    } else {
         appendToOutput("Everyone folded. The round is over.", "game-message");
    }

    const player = gameState.pokerGame.players.find(p => p.isPlayer);
    gameState.money = player.chips;
    updateMoneyUI(gameState.money);

    gameState.pokerGame.isGameActive = false;
    
    if (gameState.money > 0) {
        appendToOutput("The game continues. Type 'play poker' to start the next hand.", "game-message");
    } else {
        appendToOutput("You're out of money and have been kicked out of the game.", "error-message");
        resetLoop("You lost all your money at the poker table and were unceremoniously thrown out into the dust.");
    }
    displayLocation();
    displayAvailableCommands();
}

function handleWagerCommand(itemName) {
    if (gameState.inventory.includes(itemName)) {
        const itemIndex = gameState.inventory.indexOf(itemName);
        const item = gameState.inventory.splice(itemIndex, 1)[0];
        gameState.pokerGame.pot.items.push(item);
        appendToOutput(`You toss your ${itemName} into the pot, raising the stakes.`, "game-message");
        nextPokerTurn();
    } else {
        appendToOutput(`You don't have a '${itemName}' in your inventory.`, "error-message");
    }
}

function handlePokerCommands(verb, noun) {
    const player = gameState.pokerGame.players[0];

    if (player.isFolded) {
         appendToOutput("You have already folded this round.", "error-message");
         return;
    }

    switch (verb) {
        case 'check':
            if (gameState.pokerGame.currentBet > (player.lastBet || 0)) {
                appendToOutput("You can't check, there is a bet to you. Try 'call' or 'raise'.", "error-message");
                return;
            }
            appendToOutput("You check.", "game-message");
            player.lastAction = 'check';
            nextPokerTurn();
            break;
        case 'bet':
        case 'raise':
            const amount = parseInt(noun, 10);
            if (isNaN(amount) || amount <= 0) {
                appendToOutput("You must bet a positive number.", "error-message");
                return;
            }
            if (verb === 'raise' && amount < gameState.pokerGame.currentBet * 2) {
                appendToOutput(`A raise must be at least double the current bet of $${gameState.pokerGame.currentBet}.`, "error-message");
                return;
            }
            if (amount > player.chips) {
                appendToOutput("You don't have enough money.", "error-message");
                return;
            }
            
            player.chips -= amount;
            gameState.pokerGame.pot.chips += amount;
            gameState.pokerGame.currentBet = amount;
            player.lastAction = verb;
            player.lastBet = amount;
            appendToOutput(`You ${verb} $${amount}. You have $${player.chips} left.`, "game-message");
            nextPokerTurn();
            break;
        case 'call':
            const betToCall = gameState.pokerGame.currentBet;
            if (betToCall === 0) {
                appendToOutput("There is no bet to call. You can 'check' or 'bet'.", "error-message");
                return;
            }
            const callAmount = Math.min(player.chips, betToCall);
            player.chips -= callAmount;
            gameState.pokerGame.pot.chips += callAmount;
            player.lastAction = 'call';
            player.lastBet = callAmount;
            appendToOutput(`You call $${callAmount}. You have $${player.chips} left.`, "game-message");
            nextPokerTurn();
            break;
        case 'fold':
            appendToOutput("You fold your hand.", "game-message");
            player.isFolded = true;
            player.lastAction = 'fold';
            nextPokerTurn();
            break;
        case 'wager':
            handleWagerCommand(noun);
            break;
        default:
            appendToOutput(`Unknown poker command. Try 'check', 'bet', 'call', 'raise', 'wager', or 'fold'.`, "error-message");
            break;
    }
}

// --- Event Listeners and Initial Setup ---
inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = inputElement.value;
        if (command.trim() !== '') {
            processCommand(command);
            
        }
        
        inputElement.value = '';
    }
});

// --- Add this new function to handle the win condition ---
function endGame(winMessage) {
    clearOutput();
    appendToOutput(winMessage, 'story-text');
    appendToOutput("\n--- YOU HAVE BROKEN THE LOOP ---", "story-text");
    appendToOutput("Thank you for playing!", "game-message");
    gameState.isGameRunning = false;
    inputElement.disabled = true;
    const audio = document.getElementById("background-music");
    if (audio) {
        audio.pause();
    }
}


// --- Add this new function to handle the 'unlock' command ---
function handleUnlockCommand(noun) {
    if (noun !== 'door') {
        appendToOutput("Unlock what? It's best to be specific.", "error-message");
        return;
    }
    // This command only works at the cellar_door location, as per the game's structure.
    if (gameState.currentLocation !== 'cellar_door') {
        appendToOutput("You don't see a door to unlock here.", "error-message");
        return;
    }
    const coinIndex = gameState.inventory.indexOf('tarnished coin');
    if (coinIndex !== -1) {
        // Player has the required item
        appendToOutput("You kneel and insert the tarnished coin into the strange slot on the iron door. It fits perfectly. With a heavy *CLUNK*, the lock disengages.", "game-message");
        gameState.inventory.splice(coinIndex, 1); // Use up the coin

        // Dynamically update the game world state
        const cellarDoorState = gameState.worldState.cellar_door;
        cellarDoorState.description = "The heavy iron door is now unlocked. A dark staircase leads down into the cellar.";
        cellarDoorState.exits.down = 'cellar'; // Add a new exit to the now-accessible cellar

        // Update available actions for the player
        const actions = cellarDoorState.actions;
        const unlockActionIndex = actions.indexOf('unlock door');
        if (unlockActionIndex > -1) {
            actions.splice(unlockActionIndex, 1);
        }
        actions.push('go down');

        appendToOutput("The way down is now open.", "story-text");
    } else {
        // Player does not have the item
        appendToOutput("You examine the lock, but you don't have anything that fits the strange, coin-shaped slot.", "error-message");
    }
}

// --- Modify the processCommand function to include the new command ---
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
    if (gameState.pokerGame.isGameActive) {
        handlePokerCommands(verb, noun);
        return;
    }
    const currentLocation = gameState.worldState[gameState.currentLocation];
    switch (verb) {
        case 'go':
            handleGoCommand(noun, currentLocation);
            break;
        case 'travel':
            handleTravelCommand(noun);
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
        case 'trade':
            handleTradeCommand(noun);
            break;
        case 'ask':
            handleAskCommand(noun);
            break;
        case 'quit':
            handleQuitCommand();
            break;
        case 'die':
            handleDieCommand();
            break;
        case 'drink':
            handleDrinkCommand(noun, currentLocation);
            break;
        // --- Add this new case ---
        case 'unlock':
            handleUnlockCommand(noun);
            break;
        default:
            appendToOutput(`I don't understand that command: '${command}'.`, "error-message");
            break;
    }
}


// --- Modify the handleGoCommand function to trigger the win state ---
function handleGoCommand(direction, currentLocation) {
    if (currentLocation.exits[direction]) {
        const nextLocation = currentLocation.exits[direction];

        // --- Add this block to check for the win condition ---
        if (nextLocation === 'cellar') {
            const cellar = gameState.worldState[nextLocation];
            // The cellar's description contains the final text.
            endGame(cellar.description);
            return; // Stop processing to prevent moving to the location.
        }
        // --- End of new block ---

        gameState.currentLocation = nextLocation;
        gameState.visitedLocations.add(nextLocation);
        displayLocation();
        displayAvailableCommands();
    } else {
        appendToOutput("You can't go that way.", "error-message");
    }
}

// --- Modify getAvailableCommands to show location-specific actions ---
function getAvailableCommands() {
    const commands = new Set();
    const currentLocation = gameState.worldState[gameState.currentLocation];

    if (gameState.pokerGame.isGameActive) {
        ['check', 'bet [amount]', 'call', 'raise [amount]', 'wager [item]', 'fold'].forEach(cmd => commands.add(cmd));
        return Array.from(commands);
    }

    currentLocation.items.forEach(item => {
        if (!['poker table', 'cellar door', 'general store', 'gnome'].includes(item)) {
            commands.add(`get ${item}`);
        }
        commands.add(`examine ${item}`);
    });

    if (gameState.currentLocation === 'saloon_main_room') {
        commands.add('examine cellar door');
        if (currentLocation.items.includes('poker table')) {
            commands.add('play poker');
        }
    }
    
    // --- Add this block to read the actions array from story.js ---
    if (currentLocation.actions) {
        currentLocation.actions.forEach(action => commands.add(action));
    }
    // --- End of new block ---

    if (gameState.inventory.includes('tarnished coin') && gameState.currentLocation === 'bar') {
        commands.add('trade tarnished coin');
    }
    if (gameState.inventory.includes('strange concoction') && currentLocation.items.includes('strange concoction')) {
        commands.add('drink strange concoction');
    }

    if (gameState.currentLocation === 'bar' && gameState.loopTracker >= 2) {
        commands.add('ask about the loop');
    }

    if (!currentLocation.actions || !currentLocation.actions.includes('die')) {
         commands.add('die');
    }

    return Array.from(commands);
}

window.onload = startGame;
