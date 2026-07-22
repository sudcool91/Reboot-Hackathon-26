# Trust Ledger — Frontend

React + Vite frontend for the Trust Ledger reusable KYC platform.  
Built for the **LBG Reboot Hackathon 2026**.

---

## 🛠 Prerequisites

Make sure you have the following installed before running this project:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | https://nodejs.org |
| **npm** | v9 or higher (comes with Node) | — |

---

## 📦 Install Dependencies

```bash
cd Trust-Ledger/frontend
npm install
```

This installs all packages listed in `package.json`, including:
- `react` + `react-dom` — UI framework
- `framer-motion` — animations and page transitions
- `vite` — development server and build tool
- `@vitejs/plugin-react` — React HMR support in Vite

---

## 🚀 Run Locally

```bash
npm run dev
```

Opens at: **http://localhost:5173**

---

## 🏗 Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

---

## 📁 Project Structure

```
src/
├── App.jsx                  # Root shell — routing + page transitions
├── main.jsx                 # Entry point — mounts React app
├── index.css                # Global styles (all page CSS)
├── components/
│   ├── Sidebar.jsx          # Fixed left navigation
│   ├── Navbar.jsx           # Top bar (3 variants)
│   ├── FluidButton.jsx      # Animated overview button
│   └── Tour.jsx             # 5-step guided tour with spotlight
└── pages/
    ├── Dashboard.jsx         # Network topology + stats
    ├── LoanApplications.jsx  # Loan queue with filters
    ├── CreditCards.jsx       # Credit card applications
    ├── KycRegistry.jsx       # On-chain credential registry
    ├── AdminControlCenter.jsx# Role + permission matrix
    ├── LedgerExplorer.jsx    # Blockchain audit trail
    ├── NewCustomerUpload.jsx # Document upload flow
    ├── LoanDecision.jsx      # Smart contract verdict
    └── FluidOverview.jsx     # Scroll-driven explainer page
```

---

## ⚠️ Notes

- `node_modules/` and `dist/` are excluded from git via `.gitignore`
- The app works fully with mock data — no backend required to run
- When backend is ready, update `src/api.js` with `http://localhost:3000` as base URL
