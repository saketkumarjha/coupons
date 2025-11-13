function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `run_${timestamp}`;
}

function cleanText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

function parseInteger(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  }
  return 0;
}

module.exports = {
  delay,
  generateRunId,
  cleanText,
  parseInteger
};