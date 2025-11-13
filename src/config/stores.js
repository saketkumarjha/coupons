// List of stores to scrape
const STORES = [
  // Tier 1 - High Priority (Test these first)
  'amazon',
  'flipkart',
  'myntra',
  'snapdeal',
  'ajio',
  
  // Tier 2 - Medium Priority
  'nykaa',
  'croma',
  'tatacliq',
  
  // Add more as needed
  // 'reliancedigital',
  // 'firstcry',
  // 'paytmmall',
  // 'bigbasket',
  // 'pepperfry'
];

// Store name normalization map
const STORE_NAME_MAP = {
  'amazon.in': 'amazon',
  'amazon india': 'amazon',
  'flipkart.com': 'flipkart',
  'myntra.com': 'myntra',
  'snapdeal.com': 'snapdeal',
  'tata cliq': 'tatacliq',
  'tatacliq.com': 'tatacliq',
  'ajio.com': 'ajio',
  'nykaa.com': 'nykaa',
  'croma.com': 'croma',
  'reliance digital': 'reliancedigital',
  'firstcry.com': 'firstcry',
  'paytm mall': 'paytmmall',
  'shopclues.com': 'shopclues',
  'limeroad.com': 'limeroad',
  'bigbasket.com': 'bigbasket',
  'pepperfry.com': 'pepperfry'
};

module.exports = {
  STORES,
  STORE_NAME_MAP
};