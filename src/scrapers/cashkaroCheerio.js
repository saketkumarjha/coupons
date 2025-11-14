// src/scrapers/cashkaroCheerio.js
const cheerio = require("cheerio");
const BaseScraperCheerio = require("./baseScraperCheerio");
const logger = require("../utils/logger");

class CashKaroScraperCheerio extends BaseScraperCheerio {
  constructor() {
    super("CashKaro");
    this.baseUrl = "https://www.cashkaro.com";
  }

  async scrapeStores(stores) {
    const allCoupons = [];

    for (const store of stores) {
      try {
        logger.info(`[CashKaro] Scraping ${store}...`);
        const coupons = await this.scrapeStore(store);
        allCoupons.push(...coupons);
        logger.info(`[CashKaro] Found ${coupons.length} coupons for ${store}`);

        await this.delay(2000);
      } catch (error) {
        logger.error(`[CashKaro] Failed to scrape ${store}:`, error.message);
        continue;
      }
    }

    return allCoupons;
  }

  async scrapeStore(store) {
    try {
      const url = `${this.baseUrl}/${store}-coupons`;
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      const coupons = [];
      const selectors = ['[class*="coupon"]', '[class*="offer"]', ".deal-card"];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((index, element) => {
            const coupon = this.extractCouponData($, element, store);
            if (coupon) coupons.push(coupon);
          });
          break;
        }
      }

      return coupons;
    } catch (error) {
      logger.error(`[CashKaro] Error scraping ${store}: ${error.message}`);
      return [];
    }
  }

  extractCouponData($, element, store) {
    const $card = $(element);

    const code = this.extractText($card, [".code", '[class*="code"]', "code"]);

    const title = this.extractText($card, [".title", '[class*="title"]', "h3"]);

    const description = this.extractText($card, [
      ".description",
      '[class*="desc"]',
      "p",
    ]);

    const discount = this.extractText($card, [
      '[class*="discount"]',
      '[class*="offer"]',
    ]);

    const validity = this.extractText($card, [
      '[class*="validity"]',
      '[class*="expiry"]',
    ]);

    if (!code || code.length < 3) return null;
    if (["SALE", "DEAL", "OFFER"].includes(code)) return null;

    return {
      raw_code: code,
      raw_title: title,
      raw_description: description,
      raw_discount: discount,
      raw_validity: validity,
      raw_success_rate: "",
      store: store,
      source: "CashKaro",
      scraped_at: new Date().toISOString(),
    };
  }

  extractText($element, selectors) {
    for (const selector of selectors) {
      const text = $element.find(selector).first().text().trim();
      if (text) return text;
    }
    return "";
  }
}

module.exports = CashKaroScraperCheerio;
