const chrono = require('chrono-node');
const logger = require('../utils/logger');

class DateParser {
  parse(validityText) {
    if (!validityText || typeof validityText !== 'string') {
      return this.getDefaultExpiry();
    }

    const text = validityText.toLowerCase().trim();

    // Try chrono-node for natural date parsing
    const chronoResult = chrono.parseDate(text);
    if (chronoResult && chronoResult > new Date()) {
      logger.debug(`Parsed date with chrono: ${chronoResult.toISOString()}`);
      return chronoResult.toISOString();
    }

    // Pattern 1: DD MMM YYYY (31 Dec 2024)
    const pattern1 = text.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i);
    if (pattern1) {
      const date = new Date(`${pattern1[2]} ${pattern1[1]}, ${pattern1[3]}`);
      if (date > new Date()) {
        return date.toISOString();
      }
    }

    // Pattern 2: DD-MM-YYYY or DD/MM/YYYY
    const pattern2 = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (pattern2) {
      const date = new Date(`${pattern2[3]}-${pattern2[2]}-${pattern2[1]}`);
      if (date > new Date()) {
        return date.toISOString();
      }
    }

    // Pattern 3: Relative dates (30 days, 1 month)
    const daysMatch = text.match(/(\d+)\s*days?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString();
    }

    const monthsMatch = text.match(/(\d+)\s*months?/i);
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1]);
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      return date.toISOString();
    }

    // Pattern 4: Vague terms
    if (text.includes('ongoing') || text.includes('till further notice')) {
      return this.getDefaultExpiry(90); // 90 days
    }

    if (text.includes('limited') || text.includes('limited period')) {
      return this.getDefaultExpiry(30); // 30 days
    }

    if (text.includes('today only') || text.includes('today')) {
      const date = new Date();
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }

    // Default: 60 days from now
    logger.debug(`Could not parse validity: ${validityText}, using default 60 days`);
    return this.getDefaultExpiry(60);
  }

  getDefaultExpiry(days = 60) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  isExpired(validityDate) {
    if (!validityDate) return false;
    const expiry = new Date(validityDate);
    return expiry < new Date();
  }
}

module.exports = new DateParser();