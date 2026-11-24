import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")

# Admin client with service role key (for privileged operations)
supabase_admin: Optional[Client] = None
try:
    if SUPABASE_URL and SUPABASE_SECRET_KEY:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
except Exception as e:
    print(f"[Supabase] Warning: Could not initialize Supabase admin client: {e}")

# Public client with publishable key (for client-level auth)
supabase_client: Optional[Client] = None
try:
    if SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
except Exception as e:
    print(f"[Supabase] Warning: Could not initialize Supabase public client: {e}")
