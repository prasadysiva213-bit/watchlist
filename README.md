# My watchlist

A personal tracker for K-dramas, movies, and anime. Works on phone and laptop, and your data is saved online in Supabase.

## Setup

1. Create a free project at supabase.com.
2. Open SQL Editor, paste everything from `setup.sql`, and press Run.
3. Open Project Settings, then API. Copy the Project URL and the anon public key into the top of `script.js`.
4. Open Authentication, then URL Configuration. Set Site URL to your GitHub Pages link and add the same link to Redirect URLs.
5. Create a GitHub repository, upload these files, then open Settings, Pages, and choose the main branch.
6. Open your site, enter your email, and open the link from your email. Do the same once on your phone.
7. After your first sign-in, open Authentication, Sign In / Providers, and turn off new user sign-ups.

The anon key is safe to be public. Row level security in `setup.sql` means only the signed-in owner can read or change the data.

## Backup
In Supabase, open Table Editor, choose `items`, and export a CSV every few months.
