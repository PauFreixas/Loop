// --- Story Elements ---
const locations = {
    sligo_outskirts: {
        description: "At the top of Gunslinger Loop.\nThis wicked geographical accident waves to the heavens like a muddy pitch lasso. \nEvery trail leads down east into Sligo.",
        exits: {
            east: 'sligo_main_road'
        },
        items: [],
        actions: ['go east','die']
    },
    sligo_main_road: {
        description: "Sligo ain´t much of a town really, just Brimstone to the north and a small store to the south. \nTo the west, you can see a fragment of sky through Gunslinger Loop. \nCan't keep going east without a horse and a gun.",
        exits: {
            west: 'sligo_outskirts',
            north: 'saloon_main_room',
            south: 'general_store'
        },
        items: ['general store'],
        actions: ['go north (to Brimstone Bar)','examine general store', 'go south', 'die']
    },
    saloon_main_room: {
        description: "The Brimstone Bar is a place drowning in smoke and music.\nThe whiskey soothes the patrons' violent temperament. \nA long, pitch-black bar runs along the north wall. \nAn open Alley facing east .The locked Cellar to the west.\nExit is south.",
        exits: {
            east: 'back_alley',
            north: 'bar',
            west: 'cellar_door',
            south: 'sligo_main_road'
        },
        items: ['poker table'],
        actions: ['go east (into back alley)','examine poker table', 'look at patrons', 'play poker', 'die']
    },
    bar: {
        description: "The bar is made of what looks like polished obsidian. \nBehind it, a bartender with glowing red eyes polishes a chalice. \nThe main room is back to the south.",
        exits: {
            south: 'saloon_main_room'
        },
        items: [],
        actions: [ 'die']
    },
    back_alley: {
        description: "The alley is dark and grimy. \nA tarnished coin lies in a puddle of waste that sizzles when you get close. \nThe main room is back to the west.",
        exits: {
            west: 'saloon_main_room'
        },
        items: ['tarnished coin'],
        actions: ['go west (back into Brimstone)', 'get tarnished coin', 'die']
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
    }, 
    cellar: {
    name: "Cellar",
    description: "You've entered the cellar.\nThrough the dim light, you see something you don´t want to see. \nThe two small bodies lie in embrace, disposed of and forgotten. \nYou were too late. \nOn the walls, written in grime:\n'You have found the truth. The loop is broken. Now you are free.'",
    exits: [],
    items: [],
    deathMessage: "The loop is broken. You are free."
    }
};

const deathMessages = {
    sligo_outskirts: "You step off the cliff edge, plummeting into a comically named chasm.",
    sligo_main_road: "A wild-eyed outlaw draws his pistol and fires. You feel an oozing red hole near your spleen before the world dissolves.",
    saloon_main_room: "You challenge the entire room. They win.",
    bar: "You sit at the obsidian bar for a drink...And forget how to stop.\nThe bartender seems to grow stronger each passing day as you drink yourself to death.",
    back_alley: "You slip and fall head-first into the sizzling puddle. The last thing you see is the tarnished coin floating above you.",
    cellar_door: "You try to pry the heavy iron door open with your bare hands, and it snaps shut on your fingers. The pain is too much. You fall into darkness.",
    general_store: "You slap the gnome proprietor. He just blows a raspberry, and a strange wave of energy hits you. You turn to stone forever."
};

const commandAliases = {
    'n': 'go north', 's': 'go south', 'e': 'go east', 'w': 'go west',
    'go e': 'go east', 'go w': 'go west', 'go n': 'go north', 'go s': 'go south',
    'i': 'inventory', 'x': 'examine', 'l': 'look', 'h': 'help',
    'take': 'get', 'pick up': 'get', 'end it': 'die', 'exit': 'I QUIT',
};
