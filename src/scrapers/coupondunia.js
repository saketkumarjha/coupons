// src/scrapers/coupondunia.js

const cheerio = require("cheerio");
const BaseScraper = require("./baseScraper");
const logger = require("../utils/logger");
const fs = require("fs");

// Create folder if missing
if (!fs.existsSync("screenshots")) {
  fs.mkdirSync("screenshots");
}

class CouponDuniaScraper extends BaseScraper {
  constructor() {
    super("CouponDunia");
    this.baseUrl = "https://www.coupondunia.in";
  }

  async scrapeStores(stores) {
    const allCoupons = [];

    try {
      await this.initBrowser();

      for (const store of stores) {
        try {
          logger.info(`[CouponDunia] Scraping ${store}...`);
          const coupons = await this.scrapeStore(store);

          logger.info(
            `[CouponDunia] Found ${coupons.length} coupons for ${store}`
          );
          allCoupons.push(...coupons);

          await this.delay(2500); // Slightly longer delay between stores
        } catch (err) {
          logger.error(`[CouponDunia] Failed for ${store}: ${err.message}`);
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return allCoupons;
  }

  async scrapeStore(store) {
    const page = await this.createPage();

    try {
      const url = `${this.baseUrl}/${store}`;
      logger.info(`[CouponDunia] Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.timeout * 2,
      });

      // 1. Initial Page Load Check for Bot Detection
      try {
        await page.waitForSelector("body", { timeout: 15000 });
        const pageTitle = await page.title();
        const pageUrl = page.url();
        logger.info(`[CouponDunia] Page title: ${pageTitle}`);
        logger.info(`[CouponDunia] Page URL: ${pageUrl}`);

        // Check for bot detection
        if (
          pageTitle.toLowerCase().includes("captcha") ||
          pageUrl.includes("challenge") ||
          pageTitle.toLowerCase().includes("access denied") ||
          pageTitle.toLowerCase().includes("verify")
        ) {
          logger.error(
            `🚫 BOT DETECTED: Title: '${pageTitle}', URL: '${pageUrl}'`
          );
          await this.saveDebugInfo(page, store, "initial-bot-blocked");
          return [];
        }
      } catch (e) {
        logger.error(
          `[CouponDunia] Initial page load check failed: ${e.message}`
        );
        await this.saveDebugInfo(page, store, "initial-load-error");
        return [];
      }

      // 2. Handle Cookie Consent
      await this.handleCookieConsent(page);
      await this.delay(1500);

      // 3. Wait for Offer Cards
      try {
        // Wait for main container
        await page.waitForSelector(".offer-card-ctr", {
          visible: true,
          timeout: 15000,
        });
        logger.info("[CouponDunia] Found '.offer-card-ctr' selector");

        // Scroll to load lazy content
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await this.delay(3000);
        
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await this.delay(2000);

        // Wait for offer titles
        await page.waitForSelector(".offer-title", {
          visible: true,
          timeout: 15000,
        });
        logger.info("[CouponDunia] Found '.offer-title' selector");
      } catch (selectorError) {
        logger.warn(
          `[CouponDunia] Critical selectors not found for ${store}`
        );
        logger.warn(`Error: ${selectorError.message}`);
        await this.saveDebugInfo(page, store, "content-load-fail");
        return [];
      }

      // Save debug info
      await this.saveDebugInfo(page, store, "final-state");

      // Parse HTML with Cheerio
      const html = await page.content();
      const $ = cheerio.load(html);

      const cards = $(".offer-card-ctr");

      if (cards.length === 0) {
        const bodyText = $("body").text().toLowerCase();
        if (
          bodyText.includes("captcha") ||
          bodyText.includes("bot detection") ||
          bodyText.includes("verify you are human") ||
          bodyText.includes("access denied")
        ) {
          logger.error("🚫 BOT DETECTED in page content!");
        } else {
          logger.warn("⚠ No offer cards found in HTML");
        }
        await this.saveDebugInfo(page, store, "no-cards-found");
        return [];
      }

      const coupons = [];
      let count = 0;

      cards.each((i, el) => {
        if (count >= 50) return false; // Limit to 50 coupons

        const coupon = this.extractCouponData($, el, store);
        if (coupon) {
          coupons.push(coupon);
          count++;
        }
      });

      logger.info(`[CouponDunia] Extracted ${coupons.length} coupons for ${store}`);
      return coupons;

    } catch (err) {
      logger.error(`[CouponDunia] Error scraping ${store}: ${err.message}`);
      await this.saveDebugInfo(page, store, "exception-error");
      return [];
    } finally {
      await page.close();
    }
  }

  async handleCookieConsent(page) {
    logger.info("[CouponDunia] Checking for cookie consent...");
    
    const cookieSelectors = [
      "#accept-cookie-button",
      ".cookie-consent-button",
      'button:contains("Accept all")',
      'button:contains("Accept Cookies")',
      "#onetrust-accept-btn-handler",
      'button[mode="primary"]',
      'div[role="dialog"] button:contains("Agree")',
      ".accept-cookies-button",
    ];

    for (const selector of cookieSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, visible: true });
        await page.click(selector);
        logger.info(`[CouponDunia] Clicked cookie consent: ${selector}`);
        await this.delay(1000);
        return;
      } catch (e) {
        // Try next selector
      }
    }
    
    logger.info("[CouponDunia] No cookie consent found");
  }

  async saveDebugInfo(page, store, suffix) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "-");
      const filenameBase = `coupondunia-${store}-${suffix}-${timestamp}`;

      // Save screenshot
      const imgPath = `screenshots/${filenameBase}.png`;
      await page.screenshot({ path: imgPath, fullPage: true });
      logger.info(`[Debug] Screenshot: ${imgPath}`);

      // Save HTML
      const html = await page.content();
      fs.writeFileSync(`screenshots/${filenameBase}.html`, html);
      logger.info(`[Debug] HTML: screenshots/${filenameBase}.html`);
    } catch (error) {
      logger.error(`[Debug] Failed to save debug info: ${error.message}`);
    }
  }

  extractCouponData($, el, store) {
    try {
      const $card = $(el);

      const titleElement = $card.find(".offer-title");
      const descriptionElement = $card.find(".offer-desc");

      const title = titleElement.text().trim();
      const description = descriptionElement.text().trim();

      // Extract discount
      let discount = "";
      const discountText = description || title;
      const discountMatch = discountText.match(
        /(\d+%|Upto \d+%|Up to \d+%|\d+₹|₹\d+|Flat \d+%|Get \d+%)/i
      );
      if (discountMatch) {
        discount = discountMatch[0];
      }

      // Generate unique code
      const code = `CD${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      if (!title) {
        logger.warn(
          `[CouponDunia] No title found for card in ${store}, skipping`
        );
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

module.exports = CouponDuniaScraper;