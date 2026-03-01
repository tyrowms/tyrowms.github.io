# T-Stock — WH Agent v9.0

**Warehouse Digital Twin Dashboard** by TTECH Business Solutions

Enterprise-grade warehouse inventory aging analysis system for Tiryaki Agro.

## Features

- 📊 **Dashboard** — KPI cards, Turkey SVG map, aging distribution, facility type charts
- 📈 **Analiz & Risk** — Oldest stocks, value donut chart, top products, risk summary
- 📋 **Raporlar** — 5-tab pivot analysis (Company/Facility/L2/L3/Origin), PDF/Excel export
- 🗃️ **Ham Veri** — Full CRUD data table with inline editing, search, sort
- ⚙️ **Ayarlar** — Data management, import/export, app info
- 📱 **Mobile Responsive** — Hamburger menu, adaptive grids, touch-friendly

## Tech Stack

- React 18 + Vite
- Lucide React Icons
- SVG Turkey Map (custom)
- Glassmorphism UI
- PurchFIFO Aging Method

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
# Upload dist/ to Netlify, Vercel, or GitHub Pages
```

## GitHub Pages Deploy

```bash
# In vite.config.js, set base to your repo name:
# base: '/t-stock-wh-agent/'

npm run build
npx gh-pages -d dist
```
---
git clone https://github.com/djeanker34/TyroWhAgent.git
cd TyroWhAgent
npm install
npm run dev

Sonra tarayıcıda http://localhost:5173 açılacak. Tek gereksinim: Node.js (v18+) yüklü olması.
## Data

Built-in sample data with 25 inventory records across Tiryaki Agro facilities.
Import your own data via Excel (.xlsx) upload in the app.

### Excel Format (33 columns)
Şirket Kodu | Şirket Adı | Madde Kodu | Ürün Adı | Menşe | Proje No | Ambalaj | Gümrük | Miktar | Tesis | Tesis Adı | Depo | Ambar Adı | Parti No | L1-L5 | Fiyat ₺/$ | PurchWEAV/FIFO/LIFO | ProdWEAV/FIFO/LIFO | Gün

---

**Developer:** TTECH Business Solutions  
**© 2026** All rights reserved.
