const logger = require('../utils/logger');

class Deduplicator {
  deduplicate(coupons) {
    const seen = new Map();

    coupons.forEach(coupon => {
      // Create unique key: store + code + discount_percentage
      const key = this.createKey(coupon);

      if (!seen.has(key)) {
        seen.set(key, coupon);
      } else {
        // If duplicate, keep the one with higher success rate or from better source
        const existing = seen.get(key);
        if (this.shouldReplace(existing, coupon)) {
          seen.set(key, coupon);
        }
      }
    });

    const uniqueCoupons = Array.from(seen.values());
    logger.info(`Deduplication: ${coupons.length} → ${uniqueCoupons.length} (removed ${coupons.length - uniqueCoupons.length})`);
    
    return uniqueCoupons;
  }

  createKey(coupon) {
    return `${coupon.store}_${coupon.code}_${coupon.discount_percentage || coupon.discount_amount || 0}`.toLowerCase();
  }

  shouldReplace(existing, newCoupon) {
    // Priority 1: Success rate
    if (newCoupon.success_rate && existing.success_rate) {
      if (newCoupon.success_rate > existing.success_rate) {
        return true;
      }
      if (newCoupon.success_rate < existing.success_rate) {
        return false;
      }
    }

    // Priority 2: Source preference
    const sourceRanking = {
      'CouponDunia': 3,
      'GrabOn': 2,
      'CashKaro': 1
    };

    const existingRank = sourceRanking[existing.source] || 0;
    const newRank = sourceRanking[newCoupon.source] || 0;

    if (newRank > existingRank) {
      return true;
    }

    // Priority 3: More keywords = better
    if (newCoupon.keywords.length > existing.keywords.length) {
      return true;
    }

    return false;
  }
}

module.exports = new Deduplicator();