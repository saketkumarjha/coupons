-- Supabase Schema for Coupon Scraper
-- Run this in Supabase SQL Editor

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    store VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Discount information
    discount_text VARCHAR(255),
    discount_percentage INTEGER,
    discount_amount DECIMAL(10, 2),
    discount_type VARCHAR(50),
    
    -- Extracted data
    keywords TEXT[],
    categories TEXT[],
    product_types TEXT[],
    brands TEXT[],
    
    -- Conditions
    minimum_purchase DECIMAL(10, 2) DEFAULT 0,
    maximum_discount DECIMAL(10, 2),
    excluded_brands TEXT[],
    
    -- Validity
    valid_until TIMESTAMP WITH TIME ZONE,
    success_rate INTEGER,
    source VARCHAR(100) NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Tracking
    scrape_count INTEGER DEFAULT 1,
    first_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_store ON public.coupons(store);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_source ON public.coupons(source);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_store_code ON public.coupons(store, code);

-- Create scrape_logs table
CREATE TABLE IF NOT EXISTS public.scrape_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    coupons_found INTEGER DEFAULT 0,
    coupons_added INTEGER DEFAULT 0,
    coupons_updated INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for scrape_logs
CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_id ON public.scrape_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_created_at ON public.scrape_logs(created_at DESC);

-- Create function to increment scrape count
CREATE OR REPLACE FUNCTION increment_scrape_count(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.coupons
    SET scrape_count = scrape_count + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role to access (adjust as needed)
CREATE POLICY "Enable read access for all users" ON public.coupons
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON public.coupons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON public.coupons
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for scrape_logs" ON public.scrape_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for scrape_logs" ON public.scrape_logs
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.scrape_logs TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.scrape_logs TO anon, authenticated;
