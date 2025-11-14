// src/scrapers/baseScraperCheerio.js
// Cheerio-only base scraper (no Puppeteer)

const axios = require("axios");
const logger = require("../utils/logger");

class BaseScraperCheerio {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.timeout = parseInt(process.env.SCRAPER_TIMEOUT) || 30000;
    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
  }

  async fetchHTML(url) {
    try {
      logger.info(`[${this.sourceName}] Fetching: ${url}`);
      const response = await this.axiosInstance.get(url);
      logger.info(`[${this.sourceName}] Successfully fetched HTML`);
      return response.data;
    } catch (error) {
      logger.error(
        `[${this.sourceName}] Failed to fetch ${url}: ${error.message}`
      );
      throw error;
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

        const delayMs = 2000 * attempt;
        logger.info(`⏳ Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }
  }
}

module.exports = BaseScraperCheerio;
