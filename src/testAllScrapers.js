// Test all Cheerio scrapers
require("dotenv").config();
const CouponDuniaScraperCheerio = require("./scrapers/couponduniaCheerio");
const GrabOnScraperCheerio = require("./scrapers/grabonCheerio");
const CashKaroScraperCheerio = require("./scrapers/cashkaroCheerio");
const logger = require("./utils/logger");

async function testAllScrapers() {
  logger.info("🧪 Testing all Cheerio scrapers...");

  const testStores = ["amazon"];
  const results = {};

  // Test CouponDunia
  try {
    logger.info("\n📍 Testing CouponDunia...");
    const cdScraper = new CouponDuniaScraperCheerio();
    const cdCoupons = await cdScraper.scrapeStores(testStores);
    results.coupondunia = cdCoupons.length;
    logger.info(`✅ CouponDunia: ${cdCoupons.length} coupons`);
  } catch (error) {
    logger.error(`❌ CouponDunia failed: ${error.message}`);
    results.coupondunia = 0;
  }

  // Test GrabOn
  try {
    logger.info("\n📍 Testing GrabOn...");
    const goScraper = new GrabOnScraperCheerio();
    const goCoupons = await goScraper.scrapeStores(testStores);
    results.grabon = goCoupons.length;
    logger.info(`✅ GrabOn: ${goCoupons.length} coupons`);
  } catch (error) {
    logger.error(`❌ GrabOn failed: ${error.message}`);
    results.grabon = 0;
  }

  // Test CashKaro
  try {
    logger.info("\n📍 Testing CashKaro...");
    const ckScraper = new CashKaroScraperCheerio();
    const ckCoupons = await ckScraper.scrapeStores(testStores);
    results.cashkaro = ckCoupons.length;
    logger.info(`✅ CashKaro: ${ckCoupons.length} coupons`);
  } catch (error) {
    logger.error(`❌ CashKaro failed: ${error.message}`);
    results.cashkaro = 0;
  }

  // Summary
  const total = Object.values(results).reduce((a, b) => a + b, 0);
  logger.info(`\n📊 Summary:`);
  logger.info(`  CouponDunia: ${results.coupondunia} coupons`);
  logger.info(`  GrabOn: ${results.grabon} coupons`);
  logger.info(`  CashKaro: ${results.cashkaro} coupons`);
  logger.info(`  Total: ${total} coupons`);

  if (total > 0) {
    logger.info(`\n✅ All scrapers working! Ready for deployment.`);
  } else {
    logger.error(`\n❌ No coupons scraped. Check the scrapers.`);
  }

  return results;
}

testAllScrapers()
  .then(() => {
    logger.info("\n🎉 Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("\n💥 Test failed:", error);
    process.exit(1);
  });
