<p align="center">
  <img src="public/ttech-logo.svg" alt="TYRO WMS Agent" width="80" />
</p>

<h1 align="center">TYRO WMS Agent</h1>

<p align="center">
  <strong>Warehouse Management System &mdash; Digital Twin Dashboard</strong><br/>
  <em>by TTECH Business Solutions for Tiryaki Agro</em>
</p>

<p align="center">
  <a href="https://tyrowms.github.io">Live Demo</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

TYRO WMS Agent is an enterprise-grade warehouse inventory aging analysis dashboard. It connects to Microsoft D365 ERP via Dataverse API, providing real-time visibility into stock aging, facility distribution, and risk analysis across all Tiryaki Agro warehouses.

## Features

- **Dashboard** — KPI cards, interactive 3D Turkey map, aging distribution charts, facility breakdown
- **Analiz & Risk** — Oldest stock analysis, value distribution, top products, risk scoring
- **Raporlar** — Multi-tab pivot analysis (Company / Facility / L2 / L3 / Origin) with PDF & Excel export
- **Rapor Satrilari** — Full CRUD data table with inline editing, search, sort, Excel import/export
- **ERP Verileri** — Live D365 Dataverse integration with one-click data sync
- **Ayarlar** — Data management, theme preferences, app configuration
- **Mobile Responsive** — Adaptive layout with hamburger menu and touch-friendly controls

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6 |
| 3D Map | Three.js, React Three Fiber, React Three Drei |
| Auth | MSAL (Azure AD) |
| ERP | Microsoft Dataverse OData API |
| Icons | Lucide React |
| Geo | D3-geo, custom Turkey provinces GeoJSON |
| Export | SheetJS (xlsx) via CDN |
| UI | Custom glassmorphism design system |

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Azure AD app registration (for ERP integration)

### Installation

```bash
git clone https://github.com/djeanker34/TYRO-WMSAgent.git
cd TYRO-WMSAgent
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_DATAVERSE_URL=https://your-instance.crm4.dynamics.com
VITE_DATAVERSE_ENTITY=your-entity-name
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Deployment

### GitHub Pages (Automated)

This project includes a GitHub Actions workflow for automatic deployment:

1. Push to `main` branch
2. GitHub Actions builds with Vite
3. Deploys to GitHub Pages automatically

**Live site:** [https://tyrowms.github.io](https://tyrowms.github.io)

### Manual Deploy

```bash
npm run build
# Upload dist/ folder to any static hosting provider
```

## Project Structure

```
src/
  App.jsx              # Main application (routing, state, UI)
  TurkeyMap3D.jsx      # 3D Turkey map with Three.js
  dataverseService.js  # MSAL auth & Dataverse API client
  main.jsx             # Entry point with ErrorBoundary
  turkey-provinces.json # GeoJSON province boundaries
```

## Data Format

Import inventory data via Excel (.xlsx) with 33 columns:

`Sirket Kodu | Sirket Adi | Madde Kodu | Urun Adi | Mense | Proje No | Ambalaj | Gumruk | Miktar | Tesis | Tesis Adi | Depo | Ambar Adi | Parti No | L1-L5 | Fiyat TL/USD | PurchWEAV/FIFO/LIFO | ProdWEAV/FIFO/LIFO | Gun`

---

<p align="center">
  <strong>TTECH Business Solutions</strong><br/>
  &copy; 2026 Tiryaki Agro &mdash; All rights reserved.
</p>
