// Debug GrabOn HTML structure
const axios = require("axios");
const cheerio = require("cheerio");

async function debugGrabOn() {
  try {
    const url = "https://www.grabon.in/amazon-coupons";
    console.log(`Fetching: ${url}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Get first coupon card
    const firstCard = $(".gc-box.banko").first();

    console.log("\n📦 First Card HTML (first 500 chars):");
    console.log(firstCard.html().substring(0, 500));

    console.log("\n🔍 Extracting data from first card:");
    console.log("Title (.bank p):", firstCard.find(".bank p").text().trim());
    console.log(
      "Discount (.visible-ip first):",
      firstCard.find(".visible-ip").first().text().trim()
    );
    console.log(
      "All visible-ip:",
      firstCard
        .find(".visible-ip")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log("Verified:", firstCard.find(".verified").length > 0);
    console.log("Data merchant:", firstCard.attr("data-merchant"));

    // Try all p tags
    console.log("\nAll <p> tags:");
    firstCard.find("p").each((i, el) => {
      console.log(`  p[${i}]:`, $(el).text().trim().substring(0, 100));
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

debugGrabOn();
