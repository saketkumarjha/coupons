require('dotenv').config();
const express = require('express');
const { setupCronJob } = require('./cron');
const { runScraping } = require('./services/orchestrator');
const { getScrapingStats } = require('./services/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Manual trigger endpoint
app.post('/scrape/trigger', async (req, res) => {
  try {
    logger.info('Manual scrape triggered via API');
    
    // Run scraping in background
    runScraping()
      .then(result => {
        logger.info('Manual scrape completed', result);
      })
      .catch(error => {
        logger.error('Manual scrape failed', error);
      });
    
    res.json({ 
      success: true, 
      message: 'Scraping started in background'
    });
  } catch (error) {
    logger.error('Error triggering scrape:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  try {
    const stats = await getScrapingStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Coupon Scraper',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      trigger: 'POST /scrape/trigger',
      stats: '/stats'
    }
  });
});

// Setup cron job
setupCronJob();

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Coupon Scraper running on port ${PORT}`);
  logger.info(`📅 Cron job scheduled: Every ${process.env.SCRAPE_INTERVAL || 6} hours`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});