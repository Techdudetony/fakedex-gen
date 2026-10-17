# Fakedex Gen

A Pokédex-style web app for original "fakemon". Describe a creature (types, base stats, abilities, design notes, art style, color palette, reference images) and the app writes its dex entry with Claude, draws it with Gemini, and saves it to your Fakedex.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

Open http://localhost:3000.

Every key is optional while developing:

| Variable | Used for | Without it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Writing the dex entry and image prompt (Claude) | Placeholder text |
| `GEMINI_API_KEY` | Drawing the fakemon (Gemini image model) | Placeholder images |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storing entries and images | Saved to `.data/` locally |
| `FAKEDEX_PASSWORD` | Password-protecting the whole site (any username) | Site is open to anyone |

To use Supabase, run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor. It creates the `entries` table and a public `fakemon-images` bucket. Supabase is required when deploying to Vercel, since the local `.data/` folder doesn't persist there. Set `FAKEDEX_PASSWORD` on any public deployment, or anyone who finds it can spend your API credits.

## How it works

1. `/create` collects the trainer's input.
2. `POST /api/generate` sends it (and any reference images) to Claude, which returns structured JSON: category, height, weight, habitat, flavor text, polished abilities, a signature move, and an image prompt.
3. `POST /api/images` sends the image prompt and references to Gemini and returns four candidates. The prompt is editable so you can redraw.
4. `POST /api/entries` saves the chosen image and entry and assigns the next dex number.
5. `/` lists your dex with search and a type filter; `/entry/[id]` shows a full entry.
