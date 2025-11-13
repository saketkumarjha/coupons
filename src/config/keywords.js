// Product type mappings for keyword extraction
const PRODUCT_TYPES = {
  electronics: {
    laptop: ['laptop', 'notebook', 'macbook', 'chromebook', 'ultrabook', 'gaming laptop', 'business laptop'],
    mobile: ['phone', 'mobile', 'smartphone', 'iphone', 'android phone', 'samsung galaxy', 'pixel'],
    tablet: ['tablet', 'ipad', 'tab', 'kindle', 'e-reader'],
    tv: ['tv', 'television', 'smart tv', 'led tv', 'oled', 'qled', '4k tv', '8k tv'],
    camera: ['camera', 'dslr', 'mirrorless', 'gopro', 'action camera', 'webcam', 'camcorder'],
    headphone: ['headphone', 'earphone', 'earbuds', 'airpods', 'headset', 'tws', 'wireless earbuds', 'neckband'],
    speaker: ['speaker', 'bluetooth speaker', 'soundbar', 'home theater', 'portable speaker', 'smart speaker'],
    smartwatch: ['watch', 'smartwatch', 'fitness band', 'apple watch', 'fitness tracker', 'smart band'],
    gaming: ['playstation', 'xbox', 'nintendo', 'gaming console', 'ps5', 'ps4', 'gaming', 'controller'],
    accessories: ['charger', 'power bank', 'cable', 'adapter', 'mouse', 'keyboard', 'hard drive', 'ssd', 'pendrive', 'memory card']
  },
  
  fashion: {
    clothing: [
      'shirt', 'tshirt', 't-shirt', 'jeans', 'dress', 'kurta', 'saree', 
      'suit', 'jacket', 'hoodie', 'sweater', 'cardigan', 'blazer',
      'winterwear', 'winter wear', 'winter clothing', 'coat', 'parka',
      'tops', 'bottom', 'pants', 'trousers', 'shorts', 'skirt',
      'ethnic wear', 'western wear', 'innerwear', 'nightwear', 'activewear',
      'formal wear', 'casual wear', 'party wear'
    ],
    footwear: [
      'shoe', 'sneaker', 'sandal', 'boot', 'slipper', 'heel', 
      'formal shoes', 'sports shoes', 'casual shoes', 'running shoes',
      'flip flop', 'loafer', 'moccasin'
    ],
    accessories: [
      'bag', 'wallet', 'belt', 'sunglasses', 'jewellery', 'jewelry',
      'watch', 'backpack', 'handbag', 'luggage', 'travel bag', 
      'suitcase', 'duffle bag', 'messenger bag', 'tote bag',
      'scarf', 'stole', 'cap', 'hat'
    ]
  },
  
  home: {
    furniture: [
      'sofa', 'bed', 'chair', 'table', 'mattress', 'wardrobe', 
      'dining table', 'study table', 'bookshelf', 'cabinet',
      'dresser', 'bean bag', 'recliner', 'desk'
    ],
    appliances: [
      'refrigerator', 'fridge', 'washing machine', 'ac', 
      'air conditioner', 'microwave', 'oven', 'dishwasher',
      'water purifier', 'vacuum cleaner', 'iron', 'mixer',
      'grinder', 'toaster', 'kettle', 'air purifier', 'geyser'
    ],
    decor: [
      'curtain', 'carpet', 'lamp', 'cushion', 'wall art', 
      'painting', 'rug', 'photo frame', 'mirror', 'clock',
      'vase', 'candle', 'showpiece'
    ],
    kitchen: [
      'cookware', 'utensils', 'dinner set', 'crockery',
      'cutlery', 'container', 'bottle', 'lunchbox'
    ],
    bedding: [
      'bedsheet', 'blanket', 'pillow', 'comforter',
      'quilt', 'duvet', 'mattress protector'
    ]
  },
  
  beauty: {
    skincare: [
      'moisturizer', 'serum', 'sunscreen', 'face wash', 
      'cream', 'lotion', 'cleanser', 'toner', 'mask',
      'scrub', 'face pack', 'night cream'
    ],
    makeup: [
      'lipstick', 'foundation', 'mascara', 'eyeliner', 
      'compact', 'kajal', 'nail polish', 'blush',
      'eye shadow', 'lip gloss', 'concealer'
    ],
    haircare: [
      'shampoo', 'conditioner', 'hair oil', 'serum', 
      'hair color', 'hair spray', 'hair mask', 'hair gel'
    ],
    fragrance: [
      'perfume', 'deodorant', 'body spray', 'cologne',
      'eau de parfum', 'body mist'
    ]
  },
  
  books: {
    general: [
      'book', 'novel', 'textbook', 'magazine', 'ebook', 
      'kindle book', 'comics', 'fiction', 'non-fiction',
      'biography', 'self-help'
    ]
  },
  
  toys: {
    general: [
      'toy', 'doll', 'action figure', 'lego', 'board game', 
      'puzzle', 'soft toy', 'baby toy', 'educational toy'
    ]
  },
  
  sports: {
    equipment: [
      'bicycle', 'cycle', 'treadmill', 'dumbbell', 'yoga mat', 
      'cricket bat', 'football', 'gym equipment', 'fitness equipment',
      'exercise bike', 'weight', 'resistance band'
    ],
    clothing: [
      'tracksuit', 'sports shoes', 'jersey', 'shorts', 
      'tights', 'sports bra', 'gym wear'
    ]
  },
  
  grocery: {
    general: [
      'grocery', 'food', 'snacks', 'beverages', 'drink',
      'milk', 'bread', 'rice', 'oil', 'dal', 'pulses',
      'spices', 'masala', 'tea', 'coffee'
    ]
  },
  
  baby: {
    general: [
      'baby', 'baby care', 'diaper', 'baby food',
      'baby oil', 'baby powder', 'baby lotion',
      'baby clothes', 'baby toy'
    ]
  }
};

// Brand names
const BRANDS = [
  // Electronics
  'asus', 'hp', 'dell', 'lenovo', 'apple', 'samsung', 'sony', 'lg',
  'mi', 'xiaomi', 'realme', 'oneplus', 'vivo', 'oppo', 'nokia', 'motorola',
  'canon', 'nikon', 'boat', 'jbl', 'bose', 'intel', 'amd', 'nvidia',
  'panasonic', 'philips', 'bajaj', 'havells', 'orient',
  
  // Fashion
  'nike', 'adidas', 'puma', 'reebok', 'levis', 'ucb', 'zara', 'h&m',
  'max', 'westside', 'mango', 'biba', 'fabindia', 'allen solly', 'van heusen',
  'peter england', 'louis philippe', 'raymond', 'manyavar', 'being human',
  
  // Home & Appliances
  'philips', 'panasonic', 'whirlpool', 'godrej', 'voltas', 'ikea',
  'nilkamal', 'urban ladder', 'pepperfry', 'haier', 'blue star',
  
  // Beauty
  'lakme', 'loreal', 'l\'oreal', 'maybelline', 'nivea', 'garnier', 'dove',
  'olay', 'pond\'s', 'ponds', 'himalaya', 'biotique', 'mamaearth'
];

// Category keywords
const CATEGORY_KEYWORDS = {
  electronics: ['electronic', 'gadget', 'tech', 'digital', 'smart', 'device'],
  fashion: ['fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit'],
  home: ['home', 'furniture', 'appliance', 'kitchen', 'living', 'decor'],
  beauty: ['beauty', 'cosmetic', 'skincare', 'makeup', 'grooming', 'personal care'],
  books: ['book', 'reading', 'literature', 'publication'],
  toys: ['toy', 'kids', 'children', 'play'],
  sports: ['sport', 'fitness', 'gym', 'outdoor', 'exercise'],
  grocery: ['grocery', 'food', 'supermarket', 'pantry'],
  baby: ['baby', 'infant', 'newborn', 'toddler']
};

module.exports = {
  PRODUCT_TYPES,
  BRANDS,
  CATEGORY_KEYWORDS
};