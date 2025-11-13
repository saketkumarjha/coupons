const cheerio = require('cheerio');
const BaseScraper = require('./baseScraper');
const logger = require('../utils/logger');

class GrabOnScraper extends BaseScraper {
  constructor() {
    super('GrabOn');
    this.baseUrl = 'https://www.grabon.in';
  }

  async scrapeStores(stores) {
    const allCoupons = [];
    
    try {
      await this.initBrowser();
      
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
    } finally {
      await this.closeBrowser();
    }
    
    return allCoupons;
  }

  async scrapeStore(store) {
    const page = await this.createPage();
    
    try {
      const url = `${this.baseUrl}/${store}-coupons`;
      logger.debug(`Navigating to: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.timeout 
      });
      
      try {
        await page.waitForSelector('.coupon, .offer, [class*="coupon"]', { 
          timeout: 10000 
        });
      } catch (error) {
        logger.warn(`No coupons found for ${store} on GrabOn`);
        return [];
      }
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const coupons = [];
      const selectors = [
        '.coupon',
        '.offer',
        '[class*="CouponCard"]'
      ];
      
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
      
    } finally {
      await page.close();
    }
  }

  extractCouponData($, element, store) {
    const $card = $(element);
    
    const code = this.extractText($card, [
      '.coupon-code',
      '[class*="code"]',
      'code'
    ]);
    
    const title = this.extractText($card, [
      '.coupon-title',
      '[class*="title"]',
      'h3'
    ]);
    
    const description = this.extractText($card, [
      '.coupon-description',
      '[class*="description"]',
      'p'
    ]);
    
    const discount = this.extractText($card, [
      '.discount',
      '[class*="discount"]'
    ]);
    
    const validity = this.extractText($card, [
      '.validity',
      '[class*="expiry"]'
    ]);
    
    if (!code || code.length < 3) return null;
    if (['SALE', 'DEAL', 'OFFER'].includes(code)) return null;
    
    return {
      raw_code: code,
      raw_title: title,
      raw_description: description,
      raw_discount: discount,
      raw_validity: validity,
      raw_success_rate: '',
      store: store,
      source: 'GrabOn',
      scraped_at: new Date().toISOString()
    };
  }

  extractText($element, selectors) {
    for (const selector of selectors) {
      const text = $element.find(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }
}

module.exports = GrabOnScraper;