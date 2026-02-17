const adjectives = [
    'Swift', 'Bold', 'Clever', 'Bright', 'Noble', 'Wise', 'Brave', 'Calm',
    'Eager', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lively', 'Mighty',
    'Proud', 'Quick', 'Silent', 'Tough', 'Vivid', 'Witty', 'Zesty', 'Cool',
    'Ancient', 'Arctic', 'Aurora', 'Azure', 'Blazing', 'Brilliant', 'Celestial', 'Cosmic',
    'Crimson', 'Dazzling', 'Elegant', 'Epic', 'Eternal', 'Fabled', 'Frozen', 'Galactic',
    'Golden', 'Harmonic', 'Infinite', 'Lunar', 'Majestic', 'Mystic', 'Nebula', 'Primal',
    'Radiant', 'Sapphire', 'Solar', 'Stellar', 'Thunder', 'Titanic', 'Vast', 'Vibrant',
    'Wild', 'Zenith', 'Abundant', 'Agile', 'Alpine', 'Amber', 'Apex', 'Arctic',
    'Astral', 'Atlas', 'Aurora', 'Avalanche', 'Azure', 'Baron', 'Basil', 'Beacon',
    'Blaze', 'Blizzard', 'Bolt', 'Boulder', 'Breeze', 'Cascade', 'Celestial', 'Champion',
    'Chrome', 'Citadel', 'Cliff', 'Cloud', 'Comet', 'Coral', 'Crest', 'Crimson',
    'Crystal', 'Cyclone', 'Dawn', 'Delta', 'Diamond', 'Dragon', 'Drift', 'Echo',
    'Eclipse', 'Elite', 'Emerald', 'Empire', 'Enigma', 'Epic', 'Epoch', 'Equinox',
    'Eternal', 'Everest', 'Falcon', 'Fathom', 'Fierce', 'Flame', 'Flash', 'Flux',
    'Forge', 'Fortress', 'Frost', 'Fury', 'Galaxy', 'Gale', 'Glacier', 'Glow',
    'Granite', 'Gravity', 'Grove', 'Guardian', 'Harbor', 'Harmony', 'Hawk', 'Haze',
    'Helix', 'Horizon', 'Hurricane', 'Ice', 'Inferno', 'Infinity', 'Iris', 'Iron',
    'Jade', 'Jaguar', 'Jester', 'Jewel', 'Jolt', 'Jungle', 'Jupiter', 'Karma',
    'Keen', 'Kestrel', 'Kinetic', 'King', 'Knight', 'Kraken', 'Lagoon', 'Lance',
    'Lava', 'Legend', 'Leopard', 'Lightning', 'Lion', 'Lotus', 'Lunar', 'Lynx',
    'Magnet', 'Majestic', 'Mammoth', 'Mantle', 'Marble', 'Mars', 'Matrix', 'Meadow',
    'Mercury', 'Meteor', 'Midnight', 'Mighty', 'Mirage', 'Mist', 'Monarch', 'Monolith',
    'Moon', 'Mountain', 'Mystic', 'Nebula', 'Neon', 'Nexus', 'Nimbus', 'Noble',
    'Nova', 'Obsidian', 'Ocean', 'Onyx', 'Oracle', 'Orbit', 'Orion', 'Panther',
    'Paragon', 'Peak', 'Pearl', 'Pebble', 'Phantom', 'Phoenix', 'Pinnacle', 'Plasma',
    'Platinum', 'Polar', 'Prism', 'Pulse', 'Pyramid', 'Quantum', 'Quasar', 'Quartz',
    'Quicksilver', 'Radiance', 'Rage', 'Rainbow', 'Rampart', 'Raven', 'Reef', 'Rift',
    'Ripple', 'River', 'Roar', 'Rocket', 'Rogue', 'Rune', 'Sage', 'Sapphire',
    'Saturn', 'Savanna', 'Scarlet', 'Scout', 'Serpent', 'Shadow', 'Shard', 'Shark',
    'Shield', 'Shimmer', 'Shock', 'Shore', 'Shroud', 'Sierra', 'Silk', 'Silver',
    'Sky', 'Slate', 'Smoke', 'Snap', 'Solar', 'Sonic', 'Soul', 'Spark',
    'Specter', 'Spire', 'Spirit', 'Sprint', 'Star', 'Stealth', 'Steel', 'Stellar',
    'Storm', 'Stride', 'Summit', 'Sun', 'Surge', 'Swamp', 'Swift', 'Talon',
    'Tango', 'Temple', 'Tempest', 'Terra', 'Thunder', 'Tide', 'Tiger', 'Titan',
    'Titanium', 'Tornado', 'Torrent', 'Tower', 'Trail', 'Tranquil', 'Trap', 'Trek',
    'Tremor', 'Tribe', 'Trident', 'Tropic', 'Tsunami', 'Tundra', 'Turbo', 'Twilight',
    'Twin', 'Typhoon', 'Ultra', 'Umbra', 'Unicorn', 'Unity', 'Uranus', 'Urchin',
    'Urge', 'Utopia', 'Vanguard', 'Vapor', 'Vast', 'Vector', 'Veil', 'Velocity',
    'Venom', 'Venus', 'Verdant', 'Vermillion', 'Vertex', 'Vessel', 'Vex', 'Vibe',
    'Vibrant', 'Vice', 'Vicious', 'Vigil', 'Vigor', 'Viking', 'Vile', 'Vine',
    'Vintage', 'Violet', 'Viper', 'Virtue', 'Vision', 'Vista', 'Vital', 'Vivid',
    'Void', 'Volcano', 'Volt', 'Vortex', 'Voyage', 'Vulcan', 'Warden', 'Warrior',
    'Wave', 'Weaver', 'Whale', 'Whirl', 'Whisper', 'Wild', 'Willow', 'Wind',
    'Wing', 'Wisdom', 'Wisp', 'Witch', 'Wizard', 'Wolf', 'Wonder', 'Wood',
    'Wrath', 'Wreath', 'Wreck', 'Wren', 'Wrestle', 'Wright', 'Writhe', 'Wyvern',
    'Xenon', 'Xerox', 'Yacht', 'Yard', 'Yarn', 'Yearn', 'Yell', 'Yellow',
    'Yelp', 'Yield', 'Yin', 'Yoke', 'Yonder', 'Young', 'Youth', 'Yowl',
    'Zen', 'Zenith', 'Zephyr', 'Zero', 'Zest', 'Zigzag', 'Zinc', 'Zing',
    'Zion', 'Zip', 'Zodiac', 'Zone', 'Zoo', 'Zoom', 'Zulu', 'Zygote'
  ]
  
  const nouns = [
    'Tiger', 'Eagle', 'Wolf', 'Lion', 'Bear', 'Fox', 'Hawk', 'Falcon',
    'Panther', 'Jaguar', 'Phoenix', 'Dragon', 'Raven', 'Crow', 'Shark', 'Whale',
    'Stallion', 'Stag', 'Orca', 'Leopard', 'Cheetah', 'Lynx', 'Ape', 'Badger',
    'Bison', 'Boar', 'Cobra', 'Condor', 'Coyote', 'Crane', 'Deer', 'Dolphin',
    'Elk', 'Falcon', 'Gator', 'Gorilla', 'Heron', 'Hyena', 'Ibis', 'Jaguar',
    'Kangaroo', 'Koala', 'Lemur', 'Lobster', 'Mantis', 'Marlin', 'Mongoose', 'Moose',
    'Narwhal', 'Ocelot', 'Octopus', 'Osprey', 'Otter', 'Panda', 'Pelican', 'Penguin',
    'Puma', 'Python', 'Quail', 'Rabbit', 'Raccoon', 'Rhino', 'Salmon', 'Seal',
    'Serval', 'Shark', 'Sheep', 'Skunk', 'Sloth', 'Snake', 'Sparrow', 'Squid',
    'Squirrel', 'Stingray', 'Swan', 'Tapir', 'Tiger', 'Toucan', 'Trout', 'Tuna',
    'Turkey', 'Turtle', 'Viper', 'Vulture', 'Walrus', 'Wasp', 'Weasel', 'Wildebeest',
    'Wolverine', 'Woodpecker', 'Yak', 'Zebra', 'Aardvark', 'Albatross', 'Alligator', 'Antelope',
    'Armadillo', 'Baboon', 'Barracuda', 'Bat', 'Beaver', 'Bison', 'Buffalo', 'Bull',
    'Camel', 'Capybara', 'Caribou', 'Cassowary', 'Cat', 'Chameleon', 'Cheetah', 'Chimpanzee',
    'Chinchilla', 'Chipmunk', 'Cobra', 'Cod', 'Condor', 'Cougar', 'Coyote', 'Crab',
    'Crane', 'Crocodile', 'Crow', 'Cuckoo', 'Curlew', 'Deer', 'Dingo', 'Dog',
    'Dolphin', 'Donkey', 'Dove', 'Dragon', 'Duck', 'Eagle', 'Echidna', 'Eel',
    'Egret', 'Elephant', 'Elk', 'Emu', 'Falcon', 'Ferret', 'Finch', 'Fish',
    'Flamingo', 'Fly', 'Fox', 'Frog', 'Gazelle', 'Gecko', 'Giraffe', 'Goat',
    'Goose', 'Gorilla', 'Goshawk', 'Grouse', 'Gull', 'Hamster', 'Hare', 'Hawk',
    'Hedgehog', 'Heron', 'Herring', 'Hippo', 'Hornet', 'Horse', 'Hummingbird', 'Hyena',
    'Ibis', 'Iguana', 'Impala', 'Jackal', 'Jaguar', 'Jay', 'Jellyfish', 'Kangaroo',
    'Kingfisher', 'Kite', 'Kiwi', 'Koala', 'Kudu', 'Lark', 'Lemur', 'Leopard',
    'Lion', 'Lizard', 'Llama', 'Lobster', 'Loon', 'Loris', 'Lynx', 'Macaw',
    'Maggot', 'Mallard', 'Mammoth', 'Manatee', 'Mantis', 'Marlin', 'Marmot', 'Marten',
    'Meadowlark', 'Meerkat', 'Mink', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Moth',
    'Mouse', 'Mule', 'Narwhal', 'Newt', 'Nightingale', 'Nuthatch', 'Ocelot', 'Octopus',
    'Okapi', 'Opossum', 'Orangutan', 'Orca', 'Osprey', 'Ostrich', 'Otter', 'Owl',
    'Ox', 'Oyster', 'Panda', 'Panther', 'Parrot', 'Partridge', 'Peacock', 'Pelican',
    'Penguin', 'Pheasant', 'Pig', 'Pigeon', 'Pike', 'Piranha', 'Platypus', 'Pony',
    'Porcupine', 'Porpoise', 'Possum', 'Prairie', 'Prawn', 'Ptarmigan', 'Puffin', 'Puma',
    'Python', 'Quail', 'Quetzal', 'Rabbit', 'Raccoon', 'Ram', 'Rat', 'Raven',
    'Ray', 'Reindeer', 'Rhinoceros', 'Roach', 'Robin', 'Rook', 'Rooster', 'Ruff',
    'Sable', 'Salmon', 'Sandpiper', 'Sardine', 'Scorpion', 'Seal', 'Serval', 'Shark',
    'Sheep', 'Shrew', 'Shrimp', 'Skunk', 'Sloth', 'Snail', 'Snake', 'Snipe',
    'Sole', 'Sparrow', 'Spider', 'Spoonbill', 'Squid', 'Squirrel', 'Starfish', 'Stingray',
    'Stoat', 'Stork', 'Sturgeon', 'Swallow', 'Swan', 'Swift', 'Tapir', 'Tarantula',
    'Tern', 'Terrapin', 'Thrush', 'Tiger', 'Tit', 'Toad', 'Tortoise', 'Toucan',
    'Trout', 'Tuna', 'Turkey', 'Turtle', 'Vicuna', 'Viper', 'Vole', 'Vulture',
    'Wallaby', 'Walrus', 'Warbler', 'Wasp', 'Weasel', 'Whale', 'Wheatear', 'Wigeon',
    'Wildebeest', 'Wolf', 'Wolverine', 'Wombat', 'Woodcock', 'Woodpecker', 'Worm', 'Wren',
    'Yak', 'Yellowhammer', 'Zebra', 'Zebu', 'Zorilla'
  ]
  
  /**
   * Generates a deterministic name from a wallet address.
   * The same address will always produce the same name.
   * @param walletAddress - The wallet address (0x... format)
   * @returns A deterministic name in the format "Adjective Noun"
   */
  export function generateNameFromAddress(walletAddress: string): string {
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw new Error('Invalid wallet address format')
    }
  
    // Remove '0x' prefix and convert to lowercase for consistent hashing
    const address = walletAddress.slice(2).toLowerCase()
    
    // Use first 8 characters to generate adjective index
    const adjHash = parseInt(address.slice(0, 8), 16)
    const adjectiveIndex = adjHash % adjectives.length
    
    // Use next 8 characters to generate noun index
    const nounHash = parseInt(address.slice(8, 16), 16)
    const nounIndex = nounHash % nouns.length
    
    return `${adjectives[adjectiveIndex]} ${nouns[nounIndex]}`
  }
  
  /**
   * @deprecated Use generateNameFromAddress instead
   * This function is kept for backward compatibility but generates random names
   */
  export function generateRandomName(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    return `${adjective} ${noun}`
  }
  