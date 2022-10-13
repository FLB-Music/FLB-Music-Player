require("dotenv").config();
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tqfvneqybooaifvbdqlj.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function dbUpsert(table: string, content: any) {
  const { data, error } = await supabase
    .from(table)
    .insert([content], { upsert: true });
  if (error) {
    return {
      error,
    };
  } else {
    return data;
  }
}
