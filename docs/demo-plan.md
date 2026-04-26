# 🎤 Demo Plan – StudyAI

---

## 📌 1. Prezantimi i projektit (1 minutë)

StudyAI është një aplikacion web që përdor inteligjencën artificiale për të ndihmuar përdoruesit të bëjnë pyetje dhe të marrin përgjigje të shpejta dhe të organizuara.

Ky aplikacion është dizajnuar për:
- studentë
- nxënës
- persona që duan të mësojnë në mënyrë më efikase

Problemi që zgjidh:
- kërkimi i informacionit është i shpërndarë dhe i ngadalshëm  
- përdoruesit nuk kanë një vend për të ruajtur dhe organizuar përgjigjet  

Zgjidhja:
- një platformë e vetme ku mund të bësh pyetje, të marrësh përgjigje dhe t’i ruash ato

---

## 🔄 2. Flow kryesor i demos (3–4 minuta)

Gjatë prezantimit do të demonstroj këtë rrjedhë kryesore:

### 2.1 Autentikimi
- Hyrje në aplikacion (login)
- Tregoj që vetëm user i loguar ka akses (protected routes)

### 2.2 Bërja e një pyetjeje
- Shkruaj një pyetje (p.sh. "Explain photosynthesis")
- Klikoj “Ask AI”
- Tregoj loading state ("Thinking...")

### 2.3 Marrja e përgjigjes nga AI
- Shfaqet përgjigja e AI
- Tregoj që përgjigja është e formatuar dhe e lexueshme

### 2.4 Ruajtja e përgjigjes
- Klikoj “Save”
- Tregoj që ruhet në database (Supabase)

### 2.5 Organizimi sipas subject-it
- Shtoj subject (p.sh. Biology)
- Tregoj grouping sipas subject-it në dashboard

### 2.6 Edit dhe Delete
- Update një pyetje
- Delete një pyetje me confirmation modal

👉 Ky flow tregon përdorimin real të aplikacionit nga një user

---

## ⚙️ 3. Pjesët teknike (1–2 minuta)

Do të përmend shkurt:

- Next.js (frontend + routing)
- Supabase (authentication + database)
- API route për AI (chat endpoint)
- Refactor në services për clean architecture
- State management me React hooks

---

## ✅ 4. Çfarë kam kontrolluar para demos

- Login dhe signup funksionojnë pa probleme
- Session ruhet dhe nuk humbet gjatë përdorimit
- API për AI jep përgjigje valide
- Error handling funksionon
- Save / Update / Delete funksionojnë
- UI nuk crash-on në raste edge
- Environment variables janë të konfiguruara saktë
- Live demo është testuar në Vercel

---

## 🆘 5. Plan B (nëse live demo dështon)

Nëse live demo nuk punon:

- Do të përdor versionin lokal (localhost)
- Do të tregoj screenshots të aplikacionit
- Do të shpjegoj flow-n manualisht
- Repo në GitHub është gjithmonë funksionale

---

## 🎯 Qëllimi i demos

Të tregoj:
- si funksionon aplikacioni
- vlerën për përdoruesin
- strukturën teknike pa hyrë në detaje të panevojshme
