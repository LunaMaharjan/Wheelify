import express from "express";
import env from "dotenv";

import { createClient } from "@supabase/supabase-js"

env.config();

if(!process.env.DATABASE_URL || !process.env.DATABASE_KEY || !process.env.PORT){
  console.error("Environment variables are missing");
  process.exit(1);
}
const supabase = createClient(process.env.DATABASE_URL,process.env.DATABASE_KEY);

if(supabase){
  console.log("Supabase connected");
} else {
  console.error("Supabase not connected");
}
const app = express();

app.get("/", (_, response) =>
  response.json({ info: "Express app with Supabase" })
);

app.listen(process.env.PORT, () =>
  console.log(
    new Date().toLocaleTimeString() +
      `: Server is running on port ${process.env.PORT}...`
  )
);
