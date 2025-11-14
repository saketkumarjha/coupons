-- Simplified Supabase Schema (No RLS for easier setup)
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.scrape_logs CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP FUNCTION IF EXISTS increment_scrape_count(UUID);

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    store VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    discount_text VARCHAR(255),
    discount_percentage INTEGER,
    discount_amount DECIMAL(10, 2),
    discount_type VARCHAR(50),
    
    keywords TEXT[],
    categories TEXT[],
    product_types TEXT[],
    brands TEXT[],
    
    minimum_purchase DECIMAL(10, 2) DEFAULT 0,
    maximum_discount DECIMAL(10, 2),
    excluded_brands TEXT[],
    
    valid_until TIMESTAMP WITH TIME ZONE,
    success_rate INTEGER,
    source VARCHAR(100) NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    
    scrape_count INTEGER DEFAULT 1,
    first_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scrape_logs table
CREATE TABLE public.scrape_logs (
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

-- Create indexes
CREATE INDEX idx_coupons_store ON public.coupons(store);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_store_code ON public.coupons(store, code);
CREATE INDEX idx_scrape_logs_created_at ON public.scrape_logs(created_at DESC);

-- Create increment function
CREATE OR REPLACE FUNCTION increment_scrape_count(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.coupons
    SET scrape_count = scrape_count + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for easier access
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_logs DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated roles
GRANT ALL ON public.coupons TO anon, authenticated, service_role;
GRANT ALL ON public.scrape_logs TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
