const natural = require('natural');
const { PRODUCT_TYPES, BRANDS, CATEGORY_KEYWORDS } = require('../config/keywords');
const logger = require('../utils/logger');

class KeywordExtractor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'get', 'all'
    ]);
  }

  extract(description) {
    if (!description || typeof description !== 'string') {
      return this.getEmptyResult();
    }

    const text = description.toLowerCase();
    
    const extracted = {
      keywords: [],
      categories: [],
      brands: [],
      product_types: [],
      conditions: {}
    };

    // 1. Extract product types and categories
    this.extractProductTypes(text, extracted);

    // 2. Extract brands
    this.extractBrands(text, extracted);

    // 3. Extract category keywords
    this.extractCategoryKeywords(text, extracted);

    // 4. Extract conditions (minimum purchase, exclusions)
    this.extractConditions(text, extracted);

    // 5. Deduplicate and clean
    this.deduplicateAndClean(extracted);

    logger.debug('Extracted keywords:', extracted);
    return extracted;
  }

  extractProductTypes(text, extracted) {
    for (const [category, types] of Object.entries(PRODUCT_TYPES)) {
      for (const [type, variations] of Object.entries(types)) {
        for (const variation of variations) {
          if (text.includes(variation.toLowerCase())) {
            extracted.product_types.push(type);
            extracted.categories.push(category);
            extracted.keywords.push(type);
            break; // Found one variation, move to next type
          }
        }
      }
    }
  }

  extractBrands(text, extracted) {
    for (const brand of BRANDS) {
      const brandLower = brand.toLowerCase();
      // Check for whole word match
      const regex = new RegExp(`\\b${brandLower}\\b`, 'i');
      if (regex.test(text)) {
        extracted.brands.push(brand);
        extracted.keywords.push(brand);
      }
    }
  }

  extractCategoryKeywords(text, extracted) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          if (!extracted.categories.includes(category)) {
            extracted.categories.push(category);
          }
          break;
        }
      }
    }
  }

  extractConditions(text, extracted) {
    // Extract minimum purchase amount
    const minPurchasePatterns = [
      /above\s*₹?\s*(\d+[,\d]*)/i,
      /over\s*₹?\s*(\d+[,\d]*)/i,
      /minimum\s*₹?\s*(\d+[,\d]*)/i,
      /min\s*₹?\s*(\d+[,\d]*)/i,
      /on\s*orders?\s*of\s*₹?\s*(\d+[,\d]*)/i,
      /purchase\s*above\s*₹?\s*(\d+[,\d]*)/i
    ];

    for (const pattern of minPurchasePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1].replace(/,/g, '');
        extracted.conditions.minimum_purchase = parseInt(amount);
        break;
      }
    }

    // Extract maximum discount
    const maxDiscountPatterns = [
      /upto\s*₹?\s*(\d+[,\d]*)/i,
      /up\s*to\s*₹?\s*(\d+[,\d]*)/i,
      /maximum\s*₹?\s*(\d+[,\d]*)/i,
      /max\s*₹?\s*(\d+[,\d]*)/i
    ];

    for (const pattern of maxDiscountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1].replace(/,/g, '');
        extracted.conditions.maximum_discount = parseInt(amount);
        break;
      }
    }

    // Extract excluded brands
    const exclusionPatterns = [
      /except\s+([a-z\s,&]+)/i,
      /not\s+valid\s+on\s+([a-z\s,&]+)/i,
      /excluding\s+([a-z\s,&]+)/i,
      /not\s+applicable\s+on\s+([a-z\s,&]+)/i
    ];

    for (const pattern of exclusionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const excludedText = match[1].toLowerCase();
        const excludedBrands = BRANDS.filter(brand =>
          excludedText.includes(brand.toLowerCase())
        );
        if (excludedBrands.length > 0) {
          extracted.conditions.excluded_brands = excludedBrands;
          break;
        }
      }
    }
  }

  deduplicateAndClean(extracted) {
    extracted.keywords = [...new Set(extracted.keywords)];
    extracted.categories = [...new Set(extracted.categories)];
    extracted.brands = [...new Set(extracted.brands)];
    extracted.product_types = [...new Set(extracted.product_types)];
  }

  getEmptyResult() {
    return {
      keywords: [],
      categories: [],
      brands: [],
      product_types: [],
      conditions: {}
    };
  }
}

module.exports = new KeywordExtractor();