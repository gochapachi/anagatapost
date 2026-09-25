# 📮 AnagataPost — Physical Mail as a Service API for Bharat

> **The Indian alternative to [The Postal Company](https://www.thepostalcompany.com)**  
> Send real physical letters anywhere in India through a single API call, an AI agent, or a web dashboard. We handle high-grade printing (100 GSM executive bond paper), postal stamping, tamper-evident enveloping, and doorstep delivery via **India Post Speed Post** with real-time consignment tracking.

---

## 🌟 Key Features

- **🚀 1-Call Postal Dispatch:** Send letters via a simple REST API (`POST /api/v1/letters`) or through our web studio.
- **📍 100% Indian PIN Code Coverage:** Instant client & server-side lookup for all 19,101 PIN codes across 28 states and 8 Union Territories with automatic state and postal circle resolution.
- **✍️ Realistic Cursive Handwriting Engine:** Option to render letters in authentic organic handwriting fonts (`Caveat`, `Kalam`) on parchment texture for maximum open rates.
- **💬 WhatsApp Delivery Alerts via Evolution API:** Integrated with your Evolution API instance at `https://evo.anagataitsolutions.in`. Senders and recipients get real-time WhatsApp updates with live EMS Speed Post tracking links when a letter is dispatched.
- **⚡ n8n Workflow Automation:** Includes a ready-to-import workflow template (`anagatapost-n8n-workflow.json`) for your n8n instance at `https://n8n.anagataitsolutions.in`.
- **🤖 AI Agent Native:** Exposes an AI Agent Skill (`/skill.md`) and Model Context Protocol schema (`/api/mcp`) for seamless use with Cursor, Claude Code, OpenClaw, AutoGen, and Gemini.
- **🖨️ Operations / Print Partner Portal (`/admin`):** Batch queue for regional print hubs to laser-print A4 letters with folding guidelines, envelope labels, and India Post Speed Post barcodes.
- **💰 Transparent Indian Pricing:**
  - **Speed Post (Tracked 2-4 days):** ₹99 / letter
  - **Registered Post (Court-Admissible Legal Notices):** ₹129 / letter
  - **Standard Post:** ₹49 / letter

---

## 🏗️ Architecture & Stack

- **Framework:** Next.js 15 (App Router, Server & Client Components, TypeScript)
- **Styling:** Tailwind CSS with Indian postal aesthetic, stamp perforated borders, and parchment paper effects
- **Database & ORM:** PostgreSQL + Prisma ORM (with resilient in-memory fallback for instant local preview)
- **Typography:** Playfair Display (Serif), Plus Jakarta Sans (Modern UI), Caveat (Handwriting), JetBrains Mono (Code)
- **Deployment:** Docker & Coolify ready (Ubuntu 24.04 compatible)

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open AnagataPost:
- **Landing Page:** [http://localhost:3000/](http://localhost:3000/)
- **Letter Studio:** [http://localhost:3000/send](http://localhost:3000/send)
- **Customer Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Developer Hub & API Reference:** [http://localhost:3000/developers](http://localhost:3000/developers)
- **Print Partner Fulfillment Hub:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Agent Skill File:** [http://localhost:3000/skill.md](http://localhost:3000/skill.md)
- **MCP Schema:** [http://localhost:3000/api/mcp](http://localhost:3000/api/mcp)

---

## 🚀 Coolify Deployment Guide (Ubuntu 24.04)

AnagataPost is built to run directly on your VPS managed by Coolify at `https://server.anagataitsolutions.in`.

### Option A: 1-Click Docker Compose in Coolify
1. In your Coolify dashboard (`https://server.anagataitsolutions.in`), navigate to your Project / Environment.
2. Click **+ New Resource** → **Docker Compose**.
3. Paste the contents of [`docker-compose.yml`](./docker-compose.yml).
4. Configure the environment variables:
   ```env
   NEXT_PUBLIC_APP_URL=https://post.anagataitsolutions.in
   EVOLUTION_API_URL=https://evo.anagataitsolutions.in
   EVOLUTION_API_KEY=your_evolution_api_key
   EVOLUTION_INSTANCE_NAME=anagata-post
   N8N_WEBHOOK_URL=https://n8n.anagataitsolutions.in/webhook/anagatapost-events
   ```
5. Click **Deploy**. Coolify will spin up the Next.js app and the PostgreSQL database container with automatic Traefik SSL certificates!

### Option B: Git Repository Deployment
1. Push this repository to GitHub.
2. In Coolify, select **+ New Application** → **Public/Private GitHub Repository**.
3. Select the `Dockerfile` build pack.
4. Set port to `3000`.
5. Connect your existing Coolify PostgreSQL database or provide `DATABASE_URL`.
6. Click **Deploy**.

---

## ⚡ n8n & Evolution API Integrations

### 1. n8n Workflow
- Import [`anagatapost-n8n-workflow.json`](./anagatapost-n8n-workflow.json) into your n8n instance at `https://n8n.anagataitsolutions.in`.
- It listens for AnagataPost webhook events (`letter.created`, `letter.dispatched`, `letter.delivered`) and can trigger WhatsApp alerts or CRM updates.

### 2. Evolution API (WhatsApp Dispatch Alerts)
- When operators in the Print Partner portal (`/admin`) click **"Dispatch via Speed Post"**, AnagataPost calls your Evolution API at `https://evo.anagataitsolutions.in/message/sendText/anagata-post`.
- The recipient receives a WhatsApp message with their Indian Speed Post consignment number (e.g. `ED839201948IN`) and live tracking link.

---

## 📄 API Quick Reference

### Send or Draft a Letter
```bash
curl -X POST https://post.anagataitsolutions.in/api/v1/letters \
  -H "Authorization: Bearer ap_live_bharat_post_demo123" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "Aditi Sharma",
    "phone": "9876543210",
    "address": {
      "street": "Flat 402, Shanti Nilayam, 5th Cross",
      "locality": "Koramangala 4th Block",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560034"
    },
    "content": "Dear Aditi,\n\nYour physical certificate of incorporation is enclosed.\n\nWarm regards,\nAnagataPost",
    "delivery_type": "SPEED_POST",
    "handwriting": "CAVEAT"
  }'
```

---

## ⚖️ License & Credits

Built by **Anagata IT Solutions**. Designed specifically for Bharat's postal infrastructure.
