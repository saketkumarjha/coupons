// src/scrapers/couponduniaCheerio.js
// Cheerio-only version (no Puppeteer)

const cheerio = require("cheerio");
const BaseScraperCheerio = require("./baseScraperCheerio");
const logger = require("../utils/logger");

class CouponDuniaScraperCheerio extends BaseScraperCheerio {
  constructor() {
    super("CouponDunia");
    this.baseUrl = "https://www.coupondunia.in";
  }

  async scrapeStores(stores) {
    const allCoupons = [];

    for (const store of stores) {
      try {
        logger.info(`[CouponDunia] Scraping ${store}...`);
        const coupons = await this.scrapeStore(store);

        logger.info(
          `[CouponDunia] Found ${coupons.length} coupons for ${store}`
        );
        allCoupons.push(...coupons);

        await this.delay(2000);
      } catch (err) {
        logger.error(`[CouponDunia] Failed for ${store}: ${err.message}`);
      }
    }

    return allCoupons;
  }

  async scrapeStore(store) {
    try {
      const url = `${this.baseUrl}/${store}`;
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      const cards = $(".offer-card-ctr");

      if (cards.length === 0) {
        logger.warn(`[CouponDunia] No offer cards found for ${store}`);
        return [];
      }

      const coupons = [];
      let count = 0;

      cards.each((i, el) => {
        if (count >= 50) return false;

        const coupon = this.extractCouponData($, el, store);
        if (coupon) {
          coupons.push(coupon);
          count++;
        }
      });

      logger.info(
        `[CouponDunia] Extracted ${coupons.length} coupons for ${store}`
      );
      return coupons;
    } catch (err) {
      logger.error(`[CouponDunia] Error scraping ${store}: ${err.message}`);
      return [];
    }
  }

  extractCouponData($, el, store) {
    try {
      const $card = $(el);

      const titleElement = $card.find(".offer-title");
      const descriptionElement = $card.find(".offer-desc");

      const title = titleElement.text().trim();
      const description = descriptionElement.text().trim();

      let discount = "";
      const discountText = description || title;
      const discountMatch = discountText.match(
        /(\d+%|Upto \d+%|Up to \d+%|\d+₹|₹\d+|Flat \d+%|Get \d+%)/i
      );
      if (discountMatch) {
        discount = discountMatch[0];
      }

      const code = `CD${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      if (!title) {
        return null;
      }

      return {
        raw_code: code,
        raw_title: title,
        raw_description: description || title.slice(0, 200),
        raw_discount: discount,
        raw_validity: "",
        raw_success_rate: "",
        store,
        source: "CouponDunia",
        scraped_at: new Date().toISOString(),
      };
    } catch (err) {
      logger.error(
        `[CouponDunia] Error extracting coupon data for ${store}: ${err.message}`
      );
      return null;
    }
  }
}

module.exports = CouponDuniaScraperCheerio;
