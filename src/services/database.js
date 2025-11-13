const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class Database {
  async saveCoupons(coupons) {
    let added = 0;
    let updated = 0;

    try {
      for (const coupon of coupons) {
        const existing = await this.findExisting(coupon);

        if (existing) {
          // Update existing
          await this.updateCoupon(existing.id, coupon);
          updated++;
        } else {
          // Insert new
          await this.insertCoupon(coupon);
          added++;
        }
      }

      logger.info(`Database save complete: ${added} added, ${updated} updated`);
      return { added, updated };

    } catch (error) {
      logger.error('Error saving coupons to database:', error);
      throw error;
    }
  }

  async findExisting(coupon) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, scrape_count')
        .eq('store', coupon.store)
        .eq('code', coupon.code)
        .eq('discount_percentage', coupon.discount_percentage || 0)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error finding existing coupon:', error);
      return null;
    }
  }

  async insertCoupon(coupon) {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          ...coupon,
          scrape_count: 1,
          first_scraped_at: new Date().toISOString(),
          last_scraped_at: new Date().toISOString()
        });

      if (error) throw error;
      
      logger.debug(`Inserted coupon: ${coupon.code}`);
    } catch (error) {
      logger.error(`Error inserting coupon ${coupon.code}:`, error);
      throw error;
    }
  }

  async updateCoupon(id, coupon) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          ...coupon,
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Increment scrape count
      await supabase.rpc('increment_scrape_count', { coupon_id: id });

      logger.debug(`Updated coupon: ${coupon.code}`);
    } catch (error) {
      logger.error(`Error updating coupon ${coupon.code}:`, error);
      throw error;
    }
  }

  async cleanupExpired() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .lt('valid_until', new Date().toISOString())
        .eq('is_active', true)
        .select('id');

      if (error) throw error;

      const deactivated = data?.length || 0;
      logger.info(`Deactivated ${deactivated} expired coupons`);
      
      return { deactivated };
    } catch (error) {
      logger.error('Error cleaning up expired coupons:', error);
      return { deactivated: 0 };
    }
  }

  async logScrapingRun(logData) {
    try {
      const { error } = await supabase
        .from('scrape_logs')
        .insert({
          run_id: logData.runId,
          status: logData.status,
          coupons_found: logData.totalScraped || 0,
          coupons_added: logData.added || 0,
          coupons_updated: logData.updated || 0,
          error_message: logData.error || null,
          execution_time: logData.executionTime || 0
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging scraping run:', error);
    }
  }

  async getScrapingStats() {
    try {
      // Total active coupons
      const { count: totalCoupons } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Coupons by store
      const { data: byStore } = await supabase
        .from('coupons')
        .select('store')
        .eq('is_active', true);

      const storeCount = {};
      byStore?.forEach(row => {
        storeCount[row.store] = (storeCount[row.store] || 0) + 1;
      });

      // Recent scrape logs
      const { data: recentLogs } = await supabase
        .from('scrape_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        totalCoupons,
        byStore: storeCount,
        recentLogs
      };
    } catch (error) {
      logger.error('Error fetching stats:', error);
      return null;
    }
  }
}

module.exports = new Database();