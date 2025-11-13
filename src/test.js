require("dotenv").config();
const CouponDuniaScraper = require("./scrapers/coupondunia");
const keywordExtractor = require("./extractors/keywordExtractor");
const discountParser = require("./extractors/discountParser");
const dateParser = require("./extractors/dateParser");
const supabase = require("./config/supabase");
const logger = require("./utils/logger");
const fs = require("fs");

async function testScraper() {
  logger.info("🧪 Testing CouponDunia Scraper...");

  try {
    const scraper = new CouponDuniaScraper();
    const stores = ["amazon"];

    logger.info("Scraping Amazon coupons...");
    const coupons = await scraper.scrapeStores(stores);

    logger.info(`✅ Scraped ${coupons.length} coupons`);

    if (coupons.length > 0) {
      // Show first 3 coupons
      console.log("\n" + "=".repeat(80));
      console.log("📋 FIRST 3 COUPONS:");
      console.log("=".repeat(80));

      coupons.slice(0, 3).forEach((coupon, index) => {
        console.log(`\n${index + 1}. CODE: ${coupon.raw_code}`);
        console.log(`   Title: ${coupon.raw_title}`);
        console.log(`   Discount: ${coupon.raw_discount}`);
        console.log(
          `   Description: ${coupon.raw_description?.substring(0, 100)}...`
        );
        console.log(`   Validity: ${coupon.raw_validity}`);
        console.log(`   Store: ${coupon.store}`);
      });

      console.log("\n" + "=".repeat(80));

      // Save all coupons to JSON file
      const outputFile = "scraped-coupons-raw.json";
      fs.writeFileSync(outputFile, JSON.stringify(coupons, null, 2));
      console.log(`\n💾 All ${coupons.length} coupons saved to: ${outputFile}`);

      // Test extraction on first coupon
      console.log("\n" + "=".repeat(80));
      console.log("🔍 TESTING EXTRACTION ON FIRST COUPON:");
      console.log("=".repeat(80));

      const testCoupon = coupons[0];
      const text = `${testCoupon.raw_title} ${testCoupon.raw_description}`;

      console.log("\nOriginal text:", text.substring(0, 150));

      const keywords = keywordExtractor.extract(text);
      console.log(
        "\n📌 Extracted keywords:",
        JSON.stringify(keywords, null, 2)
      );

      const discount = discountParser.parse(testCoupon.raw_discount);
      console.log("\n💰 Parsed discount:", JSON.stringify(discount, null, 2));

      const validUntil = dateParser.parse(testCoupon.raw_validity);
      console.log("\n📅 Parsed validity:", validUntil);

      console.log("\n" + "=".repeat(80));
    } else {
      console.log("❌ No coupons found");
    }

    logger.info("✅ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Test failed:", error);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

testScraper();
