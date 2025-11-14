// src/scrapers/grabonCheerio.js
const cheerio = require("cheerio");
const BaseScraperCheerio = require("./baseScraperCheerio");
const logger = require("../utils/logger");

class GrabOnScraperCheerio extends BaseScraperCheerio {
  constructor() {
    super("GrabOn");
    this.baseUrl = "https://www.grabon.in";
  }

  async scrapeStores(stores) {
    const allCoupons = [];

    for (const store of stores) {
      try {
        logger.info(`[GrabOn] Scraping ${store}...`);
        const coupons = await this.scrapeStore(store);
        allCoupons.push(...coupons);
        logger.info(`[GrabOn] Found ${coupons.length} coupons for ${store}`);

        await this.delay(2000);
      } catch (error) {
        logger.error(`[GrabOn] Failed to scrape ${store}:`, error.message);
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

      // Based on the HTML structure: div.gc-box.banko
      const cards = $(".gc-box.banko");

      if (cards.length === 0) {
        logger.warn(`[GrabOn] No coupon cards found for ${store}`);
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

      logger.info(`[GrabOn] Extracted ${coupons.length} coupons for ${store}`);
      return coupons;
    } catch (error) {
      logger.error(`[GrabOn] Error scraping ${store}: ${error.message}`);
      return [];
    }
  }

  extractCouponData($, element, store) {
    try {
      const $card = $(element);

      // Extract discount/title from .bank > span.txt
      const discount = $card.find(".bank > span.txt").text().trim();

      // Extract description from direct p tag (first one)
      const description =
        $card.find("> .gcbr > p").first().text().trim() ||
        $card.find("p").first().text().trim();

      // Check if it's verified
      const isVerified = $card.find(".verified").length > 0;

      // Extract uses count
      const usesText = $card.find(".usr .bold-me").text().trim();

      // Generate a code
      const code = `GO${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      if (!discount && !description) {
        return null;
      }

      // Use discount as title, description as description
      const title = discount || description;
      const finalDescription = description || discount;

      return {
        raw_code: code,
        raw_title: title,
        raw_description: finalDescription,
        raw_discount: discount,
        raw_validity: "",
        raw_success_rate: isVerified ? `Verified - ${usesText} uses` : "",
        store: store,
        source: "GrabOn",
        scraped_at: new Date().toISOString(),
      };
    } catch (err) {
      logger.error(
        `[GrabOn] Error extracting coupon data for ${store}: ${err.message}`
      );
      return null;
    }
  }

  extractText($element, selectors) {
    for (const selector of selectors) {
      const text = $element.find(selector).first().text().trim();
      if (text) return text;
    }
    return "";
  }
}

module.exports = GrabOnScraperCheerio;
