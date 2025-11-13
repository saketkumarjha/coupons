// src/scrapers/baseScraper.js

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("../utils/logger");
const fs = require("fs");

// Register stealth plugin
puppeteer.use(StealthPlugin());

class BaseScraper {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.browser = null;
    this.timeout = parseInt(process.env.SCRAPER_TIMEOUT) || 30000;
  }

  async initBrowser() {
    if (this.browser) return this.browser;

    try {
      const isProduction = process.env.NODE_ENV === "production";

      const browserConfig = {
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
        ],
      };

      // Production-specific optimizations for Render
      if (isProduction) {
        browserConfig.args.push(
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-component-extensions-with-background-pages",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
          "--disable-renderer-backgrounding",
          "--enable-features=NetworkService,NetworkServiceInProcess",
          "--force-color-profile=srgb",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--mute-audio"
        );

        // Don't set defaultViewport to null in production
        browserConfig.defaultViewport = { width: 1920, height: 1080 };
      } else {
        browserConfig.defaultViewport = null;
      }

      // Launch with stealth plugin
      this.browser = await puppeteer.launch(browserConfig);

      logger.info(`✅ Browser initialized for ${this.sourceName}`);
      return this.browser;
    } catch (error) {
      logger.error(
        `❌ Failed to initialize browser for ${this.sourceName}:`,
        error.message
      );
      throw error;
    }
  }

  async createPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    // Set realistic user-agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set extra headers for realism
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      // Block images, stylesheets, fonts, and media
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set default timeout
    page.setDefaultTimeout(this.timeout);

    logger.info(`📄 New page created for ${this.sourceName}`);
    return page;
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info(`🔒 Browser closed for ${this.sourceName}`);
      } catch (error) {
        logger.error(
          `❌ Error closing browser for ${this.sourceName}:`,
          error.message
        );
      }
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async takeScreenshot(page, filename) {
    try {
      // Create screenshots directory if it doesn't exist
      const screenshotDir = "screenshots";
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const filepath = `${screenshotDir}/${filename}.png`;
      await page.screenshot({
        path: filepath,
        fullPage: true,
      });

      logger.info(`📸 Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`❌ Failed to take screenshot:`, error.message);
      return null;
    }
  }

  async retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `🔄 Attempt ${attempt}/${maxRetries} for ${this.sourceName}`
        );
        return await operation();
      } catch (error) {
        logger.warn(
          `⚠️ Attempt ${attempt}/${maxRetries} failed for ${this.sourceName}: ${error.message}`
        );

        if (attempt === maxRetries) {
          logger.error(
            `❌ All ${maxRetries} attempts failed for ${this.sourceName}`
          );
          throw error;
        }

        // Exponential backoff
        const delayMs = 2000 * attempt;
        logger.info(`⏳ Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }
  }

  // Helper method to save page HTML for debugging
  async savePageHTML(page, filename) {
    try {
      const screenshotDir = "screenshots";
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const html = await page.content();
      const filepath = `${screenshotDir}/${filename}.html`;
      fs.writeFileSync(filepath, html);

      logger.info(`💾 HTML saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`❌ Failed to save HTML:`, error.message);
      return null;
    }
  }

  // Helper to check if page has bot detection
  async checkForBotDetection(page) {
    try {
      const pageTitle = await page.title();
      const pageUrl = page.url();
      const bodyText = await page.evaluate(() =>
        document.body.innerText.toLowerCase()
      );

      const botIndicators = [
        "captcha",
        "challenge",
        "access denied",
        "verify you are human",
        "bot detection",
        "cloudflare",
        "security check",
      ];

      const hasIndicator = botIndicators.some(
        (indicator) =>
          pageTitle.toLowerCase().includes(indicator) ||
          pageUrl.toLowerCase().includes(indicator) ||
          bodyText.includes(indicator)
      );

      if (hasIndicator) {
        logger.error(
          `🚫 Bot detection detected for ${this.sourceName}! Title: ${pageTitle}, URL: ${pageUrl}`
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error checking for bot detection:`, error.message);
      return false;
    }
  }
}

module.exports = BaseScraper;
