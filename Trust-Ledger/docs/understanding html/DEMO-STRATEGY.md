# 🏆 Trust Ledger — Demo Strategy & Win Plan
**Hackathon: LBG Reboot 2026**

---

## �� Scoring Reminder

| Category | Weight |
|---|---|
| Idea & Potential Development | 35% |
| Architecture & Use of Technology | 35% |
| Design | 20% |
| Agility | 10% |

---

## 🎬 The Winning Presentation Journey

---

### 🎯 Before You Even Open the Laptop

**Who speaks first:**
One person sets the scene with **one sentence** — no slides, no laptop yet:

> *"Rohan opens a Lloyds account today. Tomorrow he wants a Halifax mortgage.
> He has to prove who he is — again. Passport, bills, bank statements — again.
> We built the platform that makes that 'again' disappear — forever."*

Then open the laptop. This frames everything judges see next.

---

### 📍 Stop 1 — Fluid Overview Page *(60 seconds)*
**Scoring: Idea 35% + Design 20%**

**Open it first. Don't start on Dashboard.**

- Let the scroll-driven thread animation play as someone narrates
- The thread visually connects the problem → solution → banks
- Say: *"This is the story of why this exists"*
- Scroll slowly — show the flame, the stem rows lighting up, the future web section
- **Judges see**: Beautiful, polished, animated — this team knows design

**Key line to say:**
> *"Every other team will show you a database. We'll show you a network."*

---

### 📍 Stop 2 — Dashboard *(45 seconds)*
**Scoring: Architecture 35%**

- Land on Dashboard — network topology SVG is visible immediately
- Point to the **5 nodes**: Lloyds hub, Halifax, Bank of Scotland, Credit Bureau, Regulator Observer
- Say: *"This is a live permissioned Hyperledger Fabric network — not a public blockchain, not a database. Each node has a defined role and permission set."*
- Point to the animated pulses travelling between nodes
- Show the stat cards: credentials issued, verifications today, active banks

**Key line:**
> *"The regulator node can observe every transaction — but cannot write. That's permissioned by design, not policy."*

---

### 📍 Stop 3 — New Customer Upload *(90 seconds)*
**Scoring: Idea 35% + Design 20%**

**This is your live demo moment.**

- Say: *"Rohan is a new customer. He does this exactly once."*
- Show the progress ring (3/5 steps), the stepper
- Walk through the document cards — Passport, Utility Bill, pending docs
- Say: *"Documents are encrypted and stored off-chain. What goes on-chain is only this —"* (point to txHash)
- Say: *"A SHA-256 hash. Mathematically provable. The document itself never leaves Lloyds."*

**Key line:**
> *"We're not storing your passport on a blockchain. We're storing the fingerprint of your passport."*

---

### 📍 Stop 4 — KYC Registry *(60 seconds)*
**Scoring: Architecture 35% + Idea 35%**

- Show the registry table — Rohan, Priya, Aditya rows
- Point to: credential ref, tx hash, issuer (Lloyds), status, sharedWith column
- Say: *"Priya's credential is shared with Halifax. Halifax never received her documents — they received permission to verify her reference."*
- Show the consent toggle (share/revoke per bank)
- Click revoke Halifax for Priya → show the status change
- Say: *"That single click writes a revocation transaction on-chain. Halifax's next VerifyKYC() call returns false. Instantly. Across the group."*

**Key line:**
> *"This is GDPR by architecture. There is nothing for Halifax to delete — they never had the data."*

---

### 📍 Stop 5 — Loan Decision *(90 seconds)*
**Scoring: Architecture 35% + Design 20%**

**This is your biggest technical credibility moment.**

- Say: *"Rohan now applies for a personal loan at Halifax."*
- Show the KYC verified banner at the top — green, with credential ref
- Walk the two-column layout: applicant card with 5 check badges
- Point to the Smart Contract Verdict Trace — show each step:
  IssueKYC() → VerifyKYC() → Credential Active → Auto-Approve
- Show the credit score gauge (782)
- Click Grant Loan → loan granted state

**Key line:**
> *"Halifax didn't verify Rohan. The blockchain did. Halifax just asked the question."*

---

### 📍 Stop 6 — Ledger Explorer *(60 seconds)*
**Scoring: Architecture 35%**

- Say: *"Every action we just did — every click — is here."*
- Show the audit trail: IssueKYC, ConsentGranted, VerifyKYC, LoanGranted
- Point to: block number, timestamp, tx hash, actor
- Say: *"This is immutable. I cannot edit this. No admin in this system can edit this. Not even Lloyds."*
- Say: *"If a regulator walks in tomorrow and asks 'prove you verified Rohan' — this is the answer."*

**Key line:**
> *"The audit trail isn't generated on request. It's always existed. Every transaction wrote itself here."*

---

### 📍 Stop 7 — Admin Control Center *(45 seconds)*
**Scoring: Design 20% + Architecture 35%**

- Show role cards — Loan Officer, Senior Admin, Compliance, Regulator
- Point to permission matrix — show what each role can/cannot do
- Say: *"A loan officer cannot revoke credentials. A compliance officer cannot approve loans. Permissions are enforced at the chaincode level — not just the UI."*
- Show policy rules: auto-approve threshold, document expiry window

**Key line:**
> *"We didn't build role-based access. We built role-based trust — enforced by the blockchain, not a config file."*

---

### 📍 Stop 8 — Roadmap (Back to Fluid Overview, Future section) *(30 seconds)*
**Scoring: Idea 35%**

- Scroll to the future section of Fluid Overview
- Say: *"Phase 2 — Open Banking API so any FCA-regulated lender can plug in. Phase 3 — biometric KYC. Phase 4 — industry-wide standard beyond LBG."*
- Say: *"We built this as infrastructure, not a product."*

---

## 🎤 Final Closing Line

> *"Every team here is solving KYC. We're solving KYC forever — once per customer, trusted everywhere, owned by no one and verified by everyone."*

---

## ⏱️ Time Breakdown

| Stop | Page | Time | Score Target |
|---|---|---|---|
| Hook | (spoken) | 20s | Sets tone |
| 1 | Fluid Overview | 60s | Design + Idea |
| 2 | Dashboard | 45s | Architecture |
| 3 | New Customer Upload | 90s | Idea + Design |
| 4 | KYC Registry | 60s | Architecture + Idea |
| 5 | Loan Decision | 90s | Architecture + Design |
| 6 | Ledger Explorer | 60s | Architecture |
| 7 | Admin Control Center | 45s | Design + Arch |
| 8 | Roadmap | 30s | Idea |
| Total | | ~8 min | |

---

## 🔑 3 Things That Will Make You Stand Out

1. **Don't touch the mouse nervously** — have each person own their section, confident clicks
2. **Say "on-chain" after every action** — judges are scoring architecture, remind them constantly
3. **The Ledger Explorer is your trump card** — most teams will have no audit trail. Yours is immutable. Make a big deal of it.

---

## 💡 Key Phrases To Use

- "KYC once, verify everywhere — within the Lloyds ecosystem"
- "Documents never leave the customer's bank. Only cryptographic proofs travel."
- "This is GDPR by design, not by policy."
- "The ledger is the truth. Every action is immutable."
- "We didn't just build a demo — we built the architecture that a real bank could deploy."

---

## ✅ Agility Points (easy wins)

Show your git history during presentation:
- Multiple commits visible → shows iteration
- Separate frontend / backend / docs folders → shows planning
- README with architecture → shows professionalism

---
Last updated: July 22, 2026
