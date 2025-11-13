const { STORE_NAME_MAP } = require('../config/stores');

function normalizeStoreName(storeName) {
  if (!storeName) return null;

  const lowerName = storeName.toLowerCase().trim();

  // Check direct mapping
  if (STORE_NAME_MAP[lowerName]) {
    return STORE_NAME_MAP[lowerName];
  }

  // Remove common suffixes
  const cleaned = lowerName
    .replace('.in', '')
    .replace('.com', '')
    .replace(' india', '')
    .trim();

  // Check mapping again
  if (STORE_NAME_MAP[cleaned]) {
    return STORE_NAME_MAP[cleaned];
  }

  // Return cleaned version
  return cleaned.replace(/\s+/g, '');
}

module.exports = { normalizeStoreName };