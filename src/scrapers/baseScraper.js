// BaseScraper.js

// BEFORE: const puppeteer = require('puppeteer');
const puppeteer = require("puppeteer-extra"); // Use puppeteer-extra
const StealthPlugin = require("puppeteer-extra-plugin-stealth"); // Import the plugin
const logger = require("../utils/logger");
const fs = require("fs");

class BaseScraper {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.browser = null;
    this.timeout = parseInt(process.env.SCRAPER_TIMEOUT) || 30000;

    // Register the stealth plugin once for all browser launches
    // This patches Puppeteer to bypass many bot detection techniques.
    puppeteer.use(StealthPlugin());
  }

  async initBrowser() {
    if (this.browser) return this.browser;

    try {
      // Use puppeteer-extra's launch, which will incorporate the stealth plugin
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          // '--disable-blink-features=AutomationControlled', // Stealth plugin often handles this and more advanced checks
        ],
        defaultViewport: null, // Keep this for natural viewport scaling
      });

      logger.info(`Browser initialized for ${this.sourceName}`);
      return this.browser;
    } catch (error) {
      logger.error(
        `Failed to initialize browser for ${this.sourceName}:`,
        error
      );
      throw error;
    }
  }

  async createPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    // ---- 🛡 ANTI-BOT SECTION (mostly handled by StealthPlugin, but some custom ones can stay if they don't conflict) ----

    // Set a realistic user-agent. Stealth plugin also sets one, but you can override if needed.
    // Ensure this UA is up-to-date.
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Realistic viewport - Keep this, it's good practice.
    await page.setViewport({ width: 1920, height: 1080 });

    // The following `evaluateOnNewDocument` calls are largely redundant
    // because `puppeteer-extra-plugin-stealth` covers these and more.
    // Keeping them might not hurt, but removing them simplifies the code
    // and relies on the plugin for comprehensive stealth.
    // For now, I'll comment them out to demonstrate relying on the plugin.

    /*
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false, }); });
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5], }); });
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'languages', { get: () => ["en-US", "en"], }); });
    await page.evaluateOnNewDocument(() => { window.chrome = { runtime: {}, }; });
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: "granted" })
          : originalQuery(parameters);
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({
          brands: [{ brand: "Google Chrome", version: "120" }],
          mobile: false,
          platform: "Windows",
        }),
      });
    });
    */

    // -----------------------------

    // Default timeout for page operations
    page.setDefaultTimeout(this.timeout);

    return page;
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info(`Browser closed for ${this.sourceName}`);
      } catch (error) {
        logger.error(`Error closing browser for ${this.sourceName}:`, error);
      }
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async takeScreenshot(page, filename) {
    try {
      if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots");

      await page.screenshot({
        path: `screenshots/${filename}.png`,
        fullPage: true,
      });

      logger.info(`Screenshot saved: ${filename}.png`);
    } catch (error) {
      logger.error(`Failed to take screenshot:`, error);
    }
  }

  async retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(
          `Attempt ${attempt}/${maxRetries} failed: ${error.message}`
        );
        if (attempt === maxRetries) throw error;

        await this.delay(2000 * attempt); // Exponential backoff
      }
    }
  }
}

module.exports = BaseScraper;
