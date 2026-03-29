# 👗 Tøjappen

En mobilvenlig webapp til at katalogisere tøj og generere færdige Vinted-opslag med ét klik — drevet af AI.

---

## Hvad gør den?

Tøjappen løser et simpelt problem: det tager for lang tid at lave gode Vinted-opslag.

Med appen kan du:

1. **Tag et billede** af tøjstykket med din telefon
2. **Lad AI'en analysere** — mærke, type, farve og stand gættes automatisk
3. **Udfyld størrelse og pris** (det eneste du selv skal tage stilling til)
4. **Få et færdigt Vinted-opslag** på dansk med ét klik
5. **Gem tøjstykket** i dit personlige katalog

---

## Features

- 📷 Kamera-upload direkte fra mobilbrowser
- 🤖 AI-analyse af billede (Claude Haiku) — brand, type, farve, stand, materiale
- ✍️ Automatisk genereret Vinted-opslag på dansk
- 📋 Kopiér opslag med ét tryk
- 🗂️ Katalogvisning af alle tøjstykker med billeder
- 🔐 Sikker login med magic link (eller adgangskode)
- 🔒 Billeder vises kun for indloggede brugere (signed URLs)

---

## Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + Vite |
| Hosting | Netlify (auto-deploy fra GitHub) |
| Serverless | Netlify Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| Billedlager | Supabase Storage |
| Auth | Supabase Auth (magic link + password) |
| AI | Anthropic API — Claude Haiku |

---

## Arkitektur

```
Browser (React)
    │
    ├── Supabase JS SDK       → database + auth + storage (direkte)
    │
    └── /api/analyse          → Netlify Function → Anthropic API
        /api/generate-listing → Netlify Function → Anthropic API
```

**Vigtig sikkerhedsprincip:** Anthropic API-nøglen ligger aldrig i browseren. Al kommunikation med Anthropic sker via Netlify Functions, som verificerer brugerens Supabase JWT inden de kalder API'et.

---

## Projektstruktur

```
toejappen/
├── netlify/
│   └── functions/
│       ├── analyse.js            # AI-billedanalyse (server-side)
│       └── generate-listing.js   # Vinted-opslag generering (server-side)
├── src/
│   ├── components/
│   │   ├── AddItem.jsx           # Tilføj tøjstykke (foto → AI → detaljer → opslag)
│   │   ├── Catalog.jsx           # Oversigt over alle tøjstykker
│   │   ├── ErrorBoundary.jsx     # Fejlhåndtering
│   │   ├── ItemDetail.jsx        # Detaljeside for ét tøjstykke
│   │   └── Login.jsx             # Login (magic link + password)
│   ├── lib/
│   │   ├── anthropic.js          # Klient-side kald til /api/* endpoints
│   │   └── supabase.js           # Supabase client
│   ├── App.jsx                   # Routing og auth-state
│   └── main.jsx                  # React entry point + ErrorBoundary
├── index.html
├── netlify.toml                  # Build config + redirects + security headers
├── package.json
└── vite.config.js
```

---

## Brugerflow

```
[Login]
    │
    ▼
[Katalog] ──────────────────────────────► [Tilføj tøjstykke]
    │                                           │
    ▼                                    1. Tag billede
[Tøjstykke-detalje]                      2. AI analyserer
    │                                    3. Udfyld str + pris
    ├── Kopiér Vinted-opslag             4. Generer opslag
    └── Slet tøjstykke                   5. Gem i katalog
```

---

## Database-skema

### Tabel: `items`

| Kolonne | Type | Kilde |
|---------|------|-------|
| `id` | uuid | Auto |
| `created_at` | timestamptz | Auto |
| `user_id` | uuid | Auth |
| `image_url` | text | Supabase Storage |
| `brand` | text | AI |
| `type` | text | AI |
| `colour` | text | AI |
| `condition` | text | AI |
| `material` | text | AI |
| `size` | text | Bruger |
| `price` | integer | Bruger |
| `description` | text | AI |
| `vinted_listing` | text | AI |

---

## Opsætning (lokal udvikling)

### 1. Klon repo og installér afhængigheder

```bash
git clone https://github.com/Lyneborg/toejappen.git
cd toejappen
npm install
```

### 2. Opret `.env.local`

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[din-anon-nøgle]
```

### 3. Sæt Netlify environment variables

Disse skal sættes i Netlify Dashboard → Site settings → Environment variables:

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[din-anon-nøgle]
ANTHROPIC_API_KEY=[din-anthropic-nøgle]
```

> **Bemærk:** `ANTHROPIC_API_KEY` bruges kun server-side i Netlify Functions og eksponeres **aldrig** til browseren.

### 4. Start udviklings-server

```bash
npm run dev
```

---

## Deployment

Appen deployes automatisk via GitHub → Netlify ved push til `main`.

Build-kommando: `npm run build`  
Publish-mappe: `dist`

---

## Sikkerhed

| Område | Implementering |
|--------|----------------|
| API-nøgler | Anthropic API-nøgle er kun server-side (Netlify Functions) |
| Auth | Supabase JWT verificeres i begge Netlify Functions |
| Filvalidering | Magic bytes tjekkes både klient- og server-side |
| Filnavne | Storage-stier bruger `{userId}/{timestamp}.jpg` — aldrig brugerens filnavn |
| Billedvisning | Signed URLs (1 time) — billeder kræver aktiv session |
| Input-validering | Størrelse og pris valideres begge steder |
| Prompt injection | Feltlængder begrænses i generate-listing.js |
| Signups | `shouldCreateUser: false` — ingen kan oprette ny konto |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Billedkomprimering | Maks 1920px, 85% JPEG quality inden upload |

---

## Lavet med

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Netlify](https://www.netlify.com/)
- [Anthropic Claude API](https://www.anthropic.com/)
