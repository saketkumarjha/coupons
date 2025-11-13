const cron = require('node-cron');
const { runScraping } = require('./services/orchestrator');
const logger = require('./utils/logger');

function setupCronJob() {
  const interval = process.env.SCRAPE_INTERVAL || 6;
  
  // Cron pattern: every N hours
  // For 6 hours: '0 */6 * * *'
  // For testing (every 5 minutes): '*/5 * * * *'
  const cronPattern = `0 */${interval} * * *`;
  
  cron.schedule(cronPattern, async () => {
    logger.info('⏰ Cron job triggered - Starting scheduled scrape');
    
    try {
      const result = await runScraping();
      logger.info('✅ Scheduled scraping completed successfully', {
        runId: result.runId,
        totalScraped: result.totalScraped,
        added: result.added,
        updated: result.updated
      });
    } catch (error) {
      logger.error('❌ Scheduled scraping failed:', error);
    }
  });
  
  logger.info(`✅ Cron job scheduled: Every ${interval} hours (${cronPattern})`);
  
  // Optional: Run immediately on startup (for testing)
  if (process.env.RUN_ON_STARTUP === 'true') {
    logger.info('🏃 Running initial scrape on startup...');
    runScraping().catch(err => {
      logger.error('Initial scrape failed:', err);
    });
  }
}

module.exports = { setupCronJob };