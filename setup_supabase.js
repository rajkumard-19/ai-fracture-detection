require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    console.log('🔄 Initializing Supabase database table...');

    // Note: Since we only have the 'anon' key and not the service_role key, 
    // we actually can't run DDL commands (CREATE TABLE) via the JS client easily.
    // Instead, we will print the SQL query for the user, or try to use a REST endpoint if possible.
    // Actually, for Supabase, table creation is meant to be done via the SQL Editor in the dashboard or migrations.

    console.log(`
=========================================================
⚠️  ACTION REQUIRED ON SUPABASE DASHBOARD  ⚠️
=========================================================
To save X-Ray analysis results, you must create a 'scans' 
table in your Supabase database.

Please copy the following SQL and run it in the 
Supabase SQL Editor (https://supabase.com/dashboard/project/pkivhizymhymofwgcrkr/sql/new):

CREATE TABLE public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    anatomy TEXT,
    fracture_type TEXT,
    confidence NUMERIC,
    severity TEXT,
    diagnostic_impression TEXT,
    treatment_plan TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since we only use the anon key in the backend for simplicity right now)
CREATE POLICY "Allow anonymous inserts" ON public.scans FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous selects" ON public.scans FOR SELECT TO anon USING (true);
=========================================================
`);

}

setupDatabase();
