const { PRODUCT_TYPES, CATEGORY_KEYWORDS } = require('../config/keywords');

class CategoryClassifier {
  classify(keywords, productTypes) {
    const categories = new Set();

    // 1. From product types
    for (const productType of productTypes) {
      for (const [category, types] of Object.entries(PRODUCT_TYPES)) {
        if (Object.keys(types).includes(productType)) {
          categories.add(category);
        }
      }
    }

    // 2. From keywords
    for (const keyword of keywords) {
      for (const [category, categoryWords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (categoryWords.includes(keyword.toLowerCase())) {
          categories.add(category);
        }
      }
    }

    return Array.from(categories);
  }

  getMainCategory(categories) {
    // Priority order
    const priority = [
      'electronics',
      'fashion',
      'home',
      'beauty',
      'books',
      'sports',
      'toys'
    ];

    for (const cat of priority) {
      if (categories.includes(cat)) {
        return cat;
      }
    }

    return categories[0] || 'general';
  }
}

module.exports = new CategoryClassifier();