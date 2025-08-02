// --- Story Elements ---
const locations = {
    sligo_outskirts: {
        description: "You come awake atop your horse, at the edge of the chasm that is Gunslinger Loop. At the bottom lies the town of Sligo. To the east is the main road into town.",
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
    }, 
    cellar: {
    name: "Cellar",
    description: "You've entered the cellar, a dark and dusty space. An old wooden chest sits in the center of the room. You open it and find a note with your name on it. It reads, 'You have found the truth. The loop is broken. Now you are free.' A strange light fills the room and you are transported away.",
    exits: [],
    items: [],
    deathMessage: "The loop is broken. You are free."
    }
};

const deathMessages = {
    sligo_outskirts: "You step off the cliff edge, plummeting into an satirically well named chasm.",
    sligo_main_road: "A wild-eyed stranger on a passing carriage draws his pistol and fires. You feel a searing pain before the world dissolves.",
    saloon_main_room: "You draw your own big iron from the hip and challenge the entire room. One shot you release but twenty come back at you.",
    bar: "The bartender simply stares at you. His eyes glow brighter, and you feel your essence drain away into the polished obsidian bar.",
    back_alley: "You slip and fall head-first into the sizzling puddle. The last thing you see is the tarnished coin floating above you.",
    cellar_door: "You try to pry the heavy iron door open with your bare hands, and it snaps shut on your fingers. The pain is too much. You fall into darkness.",
    general_store: "You try to talk to the gnome proprietor. He just blows a raspberry, and a strange wave of energy hits you. You turn to stone and fall into a deep slumber."
};

const commandAliases = {
    'n': 'go north', 's': 'go south', 'e': 'go east', 'w': 'go west',
    'i': 'inventory', 'x': 'examine', 'l': 'look', 'h': 'help',
    'take': 'get', 'pick up': 'get', 'end it': 'die', 'exit': 'I QUIT',
};
