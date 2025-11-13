// CouponDuniaScraper.js

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
      logger.info(`Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: "networkidle2", // Increased wait to 'networkidle2' for better dynamic content loading
        timeout: this.timeout * 2,
      });

      // ---- BEGIN: Enhanced Anti-Bot & Content Loading Logic ----

      // 1. Initial Page Load Check for Bot Detection
      try {
        await page.waitForSelector("body", { timeout: 15000 }); // Give more time for initial body load
        const pageTitle = await page.title();
        const pageUrl = page.url();
        logger.info(`[CouponDunia] Current page title: ${pageTitle}`);
        logger.info(`[CouponDunia] Current page URL: ${pageUrl}`);

        // Check for common bot detection redirects or error pages
        if (
          pageTitle.toLowerCase().includes("captcha") ||
          pageUrl.includes("challenge") ||
          pageTitle.toLowerCase().includes("access denied") ||
          pageTitle.toLowerCase().includes("verify")
        ) {
          logger.error(
            `🚫 BOT DETECTED (Initial Page): Page title or URL indicates bot-blocking. Title: '${pageTitle}', URL: '${pageUrl}'`
          );
          await this.saveDebugInfo(page, store, "initial-bot-blocked");
          return [];
        }
      } catch (e) {
        logger.error(
          `[CouponDunia] Initial page load check failed: ${e.message}`
        );
        // This could also indicate a bot block if the body never loads
        await this.saveDebugInfo(page, store, "initial-load-error");
        return [];
      }

      // 2. Handle Cookie Consent Popups or Overlays
      await this.handleCookieConsent(page);
      await this.delay(1500);

      // 3. More Robust Waiting for Offer Cards
      try {
        // Wait for the main card container first
        await page.waitForSelector(".offer-card-ctr", {
          visible: true,
          timeout: 15000,
        });
        logger.info(
          "[CouponDunia] Successfully waited for '.offer-card-ctr' selector (visible)."
        );

        // Now, scroll to trigger any lazy-loaded content
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await this.delay(3000);
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await this.delay(2000);

        // --- CRITICAL CHANGE 1: Wait for the correct title selector ---
        // Based on your HTML: class="offer-title"
        await page.waitForSelector(".offer-title", {
          visible: true,
          timeout: 15000,
        });
        logger.info(
          "[CouponDunia] Successfully waited for '.offer-title' selector (visible)."
        );
      } catch (selectorError) {
        logger.warn(
          `[CouponDunia] Critical selectors not found or visible within extended timeout for ${store}.`
        );
        logger.warn(`Error details: ${selectorError.message}`);
        logger.warn(
          "This indicates content is not loading as expected, likely due to bot detection."
        );
        await this.saveDebugInfo(page, store, "content-load-fail");
        return [];
      }

      // ---- END: Enhanced Anti-Bot & Content Loading Logic ----

      // Screenshot and HTML save (always do this for debugging)
      await this.saveDebugInfo(page, store, "final-state");

      const html = await page.content();
      const $ = cheerio.load(html);

      // Select the main offer card containers
      const cards = $(".offer-card-ctr");

      if (cards.length === 0) {
        // More specific warning if no cards are found after all attempts
        const bodyText = $("body").text().toLowerCase();
        if (
          bodyText.includes("captcha") ||
          bodyText.includes("bot detection") ||
          bodyText.includes("verify you are human") ||
          bodyText.includes("access denied") ||
          bodyText.includes("something went wrong")
        ) {
          logger.error(
            "🚫 BOT DETECTED (post-scrape check)! HTML contains CAPTCHA, bot detection, or error message."
          );
        } else {
          logger.warn(
            "⚠ Still no offer cards found in the scraped HTML. Content might not have loaded, or selector is incorrect."
          );
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

      return coupons;
    } catch (err) {
      logger.error(`Error scraping ${store}: ${err.message}`);
      await this.saveDebugInfo(page, store, "exception-error");
      return [];
    } finally {
      await page.close();
    }
  }

  // Helper to handle cookie consent (no changes needed here from previous)
  async handleCookieConsent(page) {
    logger.info("[CouponDunia] Checking for cookie consent dialog...");
    const cookieSelectors = [
      "#accept-cookie-button",
      ".cookie-consent-button",
      'button:contains("Accept all")',
      'button:contains("Accept Cookies")',
      "#onetrust-accept-btn-handler", // Common for OneTrust
      'button[mode="primary"]', // General primary button
      'div[role="dialog"] button:contains("Agree")', // General dialog agree
      ".accept-cookies-button", // Another common variation
    ];

    for (const selector of cookieSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 7000, visible: true });
        await page.click(selector);
        logger.info(`[CouponDunia] Clicked cookie consent button: ${selector}`);
        await this.delay(1000);
        return;
      } catch (e) {
        // Selector not found within timeout, try the next one
      }
    }
    logger.info("[CouponDunia] No cookie consent dialog found or clicked.");
  }

  // Helper to save debugging info (no changes needed here from previous)
  async saveDebugInfo(page, store, suffix) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "-");
      const filenameBase = `coupondunia-${store}-${suffix}-${timestamp}`;

      const imgPath = `screenshots/${filenameBase}.png`;
      await page.screenshot({ path: imgPath, fullPage: true });
      logger.info(`[Debug] Screenshot saved: ${imgPath}`);

      const html = await page.content();
      fs.writeFileSync(`screenshots/${filenameBase}.html`, html);
      logger.info(`[Debug] HTML saved: screenshots/${filenameBase}.html`);
    } catch (error) {
      logger.error(`[Debug] Failed to save debug info: ${error.message}`);
    }
  }

  // --- CRITICAL CHANGE 2: Correct extractCouponData selectors ---
  extractCouponData($, el, store) {
    try {
      const $card = $(el); // 'el' is the .offer-card-ctr

      // --- Use .offer-title and .offer-desc ---
      const titleElement = $card.find(".offer-title");
      const descriptionElement = $card.find(".offer-desc");

      const title = titleElement.text().trim();
      const description = descriptionElement.text().trim();

      let discount = "";
      if (description) {
        const discountMatch = description.match(
          /(\d+%|Upto \d+%|Up to \d+%|\d+₹)/i
        );
        if (discountMatch) {
          discount = discountMatch[0];
        }
      } else if (title) {
        // Fallback to title if description is empty
        const discountMatch = title.match(/(\d+%|Upto \d+%|Up to \d+%|\d+₹)/i);
        if (discountMatch) {
          discount = discountMatch[0];
        }
      }

      const code = `CD${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      if (!title) {
        logger.warn(
          `[CouponDunia] Could not extract title from an offer card in store ${store}. Skipping.`
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
        `Error extracting coupon data from element for store ${store}: ${err.message}`,
        err
      );
      return null;
    }
  }
}

module.exports = CouponDuniaScraper;
