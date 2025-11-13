const logger = require('../utils/logger');
const dateParser = require('../extractors/dateParser');

class Validator {
  validate(coupons) {
    return coupons.filter(coupon => this.isValid(coupon));
  }

  isValid(coupon) {
    const errors = [];

    // Rule 1: Must have code
    if (!coupon.code || coupon.code.length < 3) {
      errors.push('Invalid or missing code');
    }

    // Rule 2: Code should not be generic
    const genericCodes = ['SALE', 'DEAL', 'OFFER', 'PROMO', 'DISCOUNT'];
    if (genericCodes.includes(coupon.code.toUpperCase())) {
      errors.push('Generic code');
    }

    // Rule 3: Must have store
    if (!coupon.store) {
      errors.push('Missing store');
    }

    // Rule 4: Must have some discount
    if (!coupon.discount_percentage && !coupon.discount_amount && coupon.discount_type !== 'bogo') {
      errors.push('No discount value');
    }

    // Rule 5: Discount percentage should be reasonable
    if (coupon.discount_percentage) {
      if (coupon.discount_percentage < 1 || coupon.discount_percentage > 100) {
        errors.push(`Invalid discount percentage: ${coupon.discount_percentage}%`);
      }
    }

    // Rule 6: Discount amount should be reasonable
    if (coupon.discount_amount) {
      if (coupon.discount_amount < 1 || coupon.discount_amount > 100000) {
        errors.push(`Invalid discount amount: ₹${coupon.discount_amount}`);
      }
    }

    // Rule 7: Should not be expired
    if (coupon.valid_until && dateParser.isExpired(coupon.valid_until)) {
      errors.push('Coupon expired');
    }

    // Rule 8: Minimum purchase should be reasonable
    if (coupon.minimum_purchase && coupon.minimum_purchase > 1000000) {
      errors.push(`Unrealistic minimum purchase: ₹${coupon.minimum_purchase}`);
    }

    // Rule 9: Should have at least some keywords or description
    if (coupon.keywords.length === 0 && !coupon.description) {
      errors.push('No keywords or description');
    }

    if (errors.length > 0) {
      logger.debug(`Invalid coupon ${coupon.code}:`, errors);
      return false;
    }

    return true;
  }
}

module.exports = new Validator();