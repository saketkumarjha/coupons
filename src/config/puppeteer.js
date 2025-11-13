const puppeteer = require("puppeteer");

const getBrowserConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--disable-software-rasterizer",
      ],
    };
  }

  // Local development
  return {
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
};

async function launchBrowser() {
  try {
    const browser = await puppeteer.launch(getBrowserConfig());
    return browser;
  } catch (error) {
    console.error("Failed to launch browser:", error);
    throw error;
  }
}

module.exports = { getBrowserConfig, launchBrowser };
