const logger = require('../utils/logger');

class DiscountParser {
  parse(discountText) {
    if (!discountText || typeof discountText !== 'string') {
      return { type: null, value: null };
    }

    const text = discountText.toLowerCase().trim();

    // Pattern 1: Percentage discount (20% off, 20% discount)
    const percentageMatch = text.match(/(\d+)\s*%\s*(off|discount)/i);
    if (percentageMatch) {
      return {
        type: 'percentage',
        value: parseInt(percentageMatch[1]),
        original_text: discountText
      };
    }

    // Pattern 2: Flat amount (₹500 off, flat ₹500)
    const amountMatch = text.match(/₹\s*(\d+[,\d]*)\s*(off|discount)/i) ||
                       text.match(/flat\s*₹?\s*(\d+[,\d]*)/i) ||
                       text.match(/rs\.?\s*(\d+[,\d]*)\s*(off|discount)/i);
    
    if (amountMatch) {
      const amount = amountMatch[1].replace(/,/g, '');
      return {
        type: 'amount',
        value: parseInt(amount),
        original_text: discountText
      };
    }

    // Pattern 3: Upto discount (upto 50% off)
    const uptoMatch = text.match(/upto?\s*(\d+)\s*%/i) ||
                     text.match(/up\s*to\s*(\d+)\s*%/i);
    
    if (uptoMatch) {
      return {
        type: 'percentage',
        value: parseInt(uptoMatch[1]),
        is_max: true,
        original_text: discountText
      };
    }

    // Pattern 4: Extra discount
    const extraMatch = text.match(/extra\s*(\d+)\s*%/i);
    if (extraMatch) {
      return {
        type: 'percentage',
        value: parseInt(extraMatch[1]),
        is_extra: true,
        original_text: discountText
      };
    }

    // Pattern 5: BOGO (Buy 1 Get 1)
    if (text.match(/buy\s*\d+\s*get\s*\d+/i) || text.match(/bogo/i)) {
      return {
        type: 'bogo',
        value: null,
        original_text: discountText
      };
    }

    // Pattern 6: Free shipping
    if (text.match(/free\s*(shipping|delivery)/i)) {
      return {
        type: 'free_shipping',
        value: null,
        original_text: discountText
      };
    }

    // Pattern 7: Just percentage number (50%)
    const simplePercentage = text.match(/(\d+)%/);
    if (simplePercentage) {
      return {
        type: 'percentage',
        value: parseInt(simplePercentage[1]),
        original_text: discountText
      };
    }

    // Pattern 8: Just amount (₹500)
    const simpleAmount = text.match(/₹\s*(\d+[,\d]*)/);
    if (simpleAmount) {
      const amount = simpleAmount[1].replace(/,/g, '');
      return {
        type: 'amount',
        value: parseInt(amount),
        original_text: discountText
      };
    }

    logger.debug(`Could not parse discount: ${discountText}`);
    return {
      type: 'unknown',
      value: null,
      original_text: discountText
    };
  }

  extractPercentage(discountText) {
    const parsed = this.parse(discountText);
    return parsed.type === 'percentage' ? parsed.value : null;
  }

  extractAmount(discountText) {
    const parsed = this.parse(discountText);
    return parsed.type === 'amount' ? parsed.value : null;
  }
}

module.exports = new DiscountParser();