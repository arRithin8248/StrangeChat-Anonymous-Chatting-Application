// Anonymous name prefixes for random identity generation
const prefixes = [
    'Anonymous',
    'Ghost',
    'Shadow',
    'Phantom',
    'Mystery',
    'Unknown',
    'Incognito',
    'Stealth',
    'Hidden',
    'Secret',
    'Enigma',
    'Cipher',
    'Whisper',
    'Silent',
    'Masked'
];

/**
 * Generate a random anonymous name
 * @returns {string} Random anonymous name like "Ghost_482"
 */
const generateAnonymousName = () => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${prefix}_${number}`;
};

/**
 * Generate a unique anonymous name for a room
 * @param {Array} existingNames - Array of existing anonymous names in the room
 * @returns {string} Unique anonymous name
 */
const generateUniqueAnonymousName = (existingNames = []) => {
    let name = generateAnonymousName();
    let attempts = 0;

    while (existingNames.includes(name) && attempts < 100) {
        name = generateAnonymousName();
        attempts++;
    }

    // If still not unique, add random suffix
    if (existingNames.includes(name)) {
        name = `${name}_${Date.now().toString().slice(-4)}`;
    }

    return name;
};

module.exports = {
    generateAnonymousName,
    generateUniqueAnonymousName
};
