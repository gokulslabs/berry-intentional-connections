import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gaufxsjvjljdopodrcva.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_olF760Cq1vHLaPUzkEy49A_rlpPAArP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
