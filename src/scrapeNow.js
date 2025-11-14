// Scrape all stores and save to Supabase NOW
require("dotenv").config();
const { runScraping } = require("./services/orchestratorCheerio");
const logger = require("./utils/logger");

async function scrapeNow() {
  logger.info("🚀 Starting immediate scraping of ALL stores...");
  logger.info("📦 This will scrape and save to Supabase");

  try {
    const result = await runScraping();

    logger.info("\n" + "=".repeat(80));
    logger.info("✅ SCRAPING COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info(`📊 Results:`);
    logger.info(`   Total scraped: ${result.totalScraped} coupons`);
    logger.info(`   Unique coupons: ${result.uniqueCoupons}`);
    logger.info(`   Valid coupons: ${result.validCoupons}`);
    logger.info(`   Added to DB: ${result.added} new coupons`);
    logger.info(`   Updated in DB: ${result.updated} existing coupons`);
    logger.info(`   Execution time: ${result.executionTime}s`);
    logger.info("=".repeat(80));

    logger.info("\n✅ All coupons saved to Supabase!");
    process.exit(0);
  } catch (error) {
    logger.error("\n❌ Scraping failed:", error);
    process.exit(1);
  }
}

scrapeNow();
