const CouponDuniaScraper = require('../scrapers/coupondunia');
const GrabOnScraper = require('../scrapers/grabon');
const CashKaroScraper = require('../scrapers/cashkaro');
const { STORES } = require('../config/stores');
const keywordExtractor = require('../extractors/keywordExtractor');
const discountParser = require('../extractors/discountParser');
const dateParser = require('../extractors/dateParser');
const categoryClassifier = require('../extractors/categoryClassifier');
const deduplicator = require('./deduplicator');
const validator = require('./validator');
const database = require('./database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

async function runScraping() {
  const runId = `run_${Date.now()}`;
  const startTime = Date.now();

  logger.info(`🚀 Starting scrape run: ${runId}`);

  try {
    // Step 1: Scrape from all sources in parallel
    logger.info('📥 Step 1: Scraping from all sources...');
    const allCoupons = await scrapeAllSources(STORES);
    logger.info(`✅ Scraped ${allCoupons.length} total coupons`);

    if (allCoupons.length === 0) {
      logger.warn('⚠️  No coupons scraped, aborting run');
      return {
        runId,
        success: false,
        message: 'No coupons found'
      };
    }

    // Step 2: Enrich coupons with extracted data
    logger.info('🔍 Step 2: Enriching coupons with keywords...');
    const enrichedCoupons = enrichCoupons(allCoupons);
    logger.info(`✅ Enriched ${enrichedCoupons.length} coupons`);

    // Step 3: Deduplicate
    logger.info('🔄 Step 3: Deduplicating coupons...');
    const uniqueCoupons = deduplicator.deduplicate(enrichedCoupons);
    logger.info(`✅ ${uniqueCoupons.length} unique coupons (removed ${enrichedCoupons.length - uniqueCoupons.length} duplicates)`);

    // Step 4: Validate
    logger.info('✔️  Step 4: Validating coupons...');
    const validCoupons = validator.validate(uniqueCoupons);
    logger.info(`✅ ${validCoupons.length} valid coupons (rejected ${uniqueCoupons.length - validCoupons.length})`);

    // Step 5: Save to database
    logger.info('💾 Step 5: Saving to Supabase...');
    const saveResult = await database.saveCoupons(validCoupons);
    logger.info(`✅ Saved: ${saveResult.added} new, ${saveResult.updated} updated`);

    // Step 6: Cleanup expired
    logger.info('🧹 Step 6: Cleaning up expired coupons...');
    const cleanupResult = await database.cleanupExpired();
    logger.info(`✅ Deactivated ${cleanupResult.deactivated} expired coupons`);

    // Step 7: Log results
    const executionTime = Math.floor((Date.now() - startTime) / 1000);
    await database.logScrapingRun({
      runId,
      status: 'success',
      totalScraped: allCoupons.length,
      uniqueCoupons: uniqueCoupons.length,
      validCoupons: validCoupons.length,
      added: saveResult.added,
      updated: saveResult.updated,
      executionTime
    });

    logger.info(`✅ Scraping completed in ${executionTime}s`);

    return {
      runId,
      success: true,
      totalScraped: allCoupons.length,
      uniqueCoupons: uniqueCoupons.length,
      validCoupons: validCoupons.length,
      added: saveResult.added,
      updated: saveResult.updated,
      executionTime
    };

  } catch (error) {
    logger.error(`❌ Scraping run ${runId} failed:`, error);
    
    await database.logScrapingRun({
      runId,
      status: 'failed',
      error: error.message,
      executionTime: Math.floor((Date.now() - startTime) / 1000)
    });

    throw error;
  }
}

async function scrapeAllSources(stores) {
  const scrapers = [
    new CouponDuniaScraper(),
    new GrabOnScraper(),
    new CashKaroScraper()
  ];

  // Run all scrapers in parallel
  const results = await Promise.allSettled(
    scrapers.map(scraper => scraper.scrapeStores(stores))
  );

  // Collect successful results
  const allCoupons = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      logger.info(`✅ ${scrapers[index].sourceName}: ${result.value.length} coupons`);
      allCoupons.push(...result.value);
    } else {
      logger.error(`❌ ${scrapers[index].sourceName} failed:`, result.reason.message);
    }
  });

  return allCoupons;
}

function enrichCoupons(coupons) {
  return coupons.map(coupon => {
    try {
      // Combine description and title for better keyword extraction
      const textToAnalyze = [
        coupon.raw_title,
        coupon.raw_description,
        coupon.raw_discount
      ].filter(Boolean).join(' ');

      // Extract keywords
      const extracted = keywordExtractor.extract(textToAnalyze);

      // Parse discount
      const discount = discountParser.parse(coupon.raw_discount);

      // Parse validity date
      const validUntil = dateParser.parse(coupon.raw_validity);

      // Parse success rate
      const successRate = parseSuccessRate(coupon.raw_success_rate);

      // Classify categories
      const categories = categoryClassifier.classify(
        extracted.keywords,
        extracted.product_types
      );

      return {
        code: coupon.raw_code.toUpperCase(),
        store: coupon.store,
        title: coupon.raw_title || '',
        description: coupon.raw_description || '',
        
        discount_text: coupon.raw_discount || '',
        discount_percentage: discount.type === 'percentage' ? discount.value : null,
        discount_amount: discount.type === 'amount' ? discount.value : null,
        discount_type: discount.type,
        
        keywords: extracted.keywords,
        categories: categories,
        product_types: extracted.product_types,
        brands: extracted.brands,
        
        minimum_purchase: extracted.conditions.minimum_purchase || 0,
        maximum_discount: extracted.conditions.maximum_discount || null,
        excluded_brands: extracted.conditions.excluded_brands || [],
        
        valid_until: validUntil,
        success_rate: successRate,
        source: coupon.source,
        
        is_active: true,
        scraped_at: coupon.scraped_at
      };
    } catch (error) {
      logger.error('Error enriching coupon:', error);
      return null;
    }
  }).filter(Boolean);
}

function parseSuccessRate(successRateText) {
  if (!successRateText) return null;
  
  const match = successRateText.match(/(\d+)%/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

module.exports = { runScraping };