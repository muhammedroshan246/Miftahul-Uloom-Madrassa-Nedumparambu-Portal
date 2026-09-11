# Mifthahul Uloom Higher Secondary Madrassa Management System

> **Official Portal for Mifthahul Uloom Higher Secondary Madrassa**  
> **Location:** Nedumparambu, Vengara • **Madrassa No:** 5090 • **Range:** Vengara (No. 50)

---

## 🌟 Overview

Mifthahul Uloom Higher Secondary Madrassa Portal is a comprehensive, production-grade Madrassa Management & ERP System tailored for Islamic educational institutions. It features a complete dual-wing academic hierarchy (Classes 1 to 10, +1, +2 with separate Boys and Girls sections), passwordless student portal, faculty grading & attendance management, fee tracking, salary payroll, and office administrative controls.

---

## 🚀 Key Features

### 1. 🎓 Student & Parent Portal (Passwordless 3-Step Selection)
- **Step 1:** Select Class (Class 1 to Class 10, +1, +2).
- **Step 2:** Select Section (Boys Wing / Girls Wing) with live enrollment count.
- **Step 3:** Select Student (Roll Number, Full Name, Avatar/Photo) with instant real-time search.
- **Dashboard:** Instant access to Marksheets, Attendance Calendar, ₹100/mo Fee Receipts, Achievements, and Profile.
- **Switch Student:** 1-click header button for families to easily switch between siblings or classes.
- **Anti-IDOR Security:** Signed JWT session tokens with tamper-proof student authorization.

### 2. 👨‍🏫 Staff & Faculty Portal (Usthad ERP)
- Secure 6-digit numeric password authentication for all faculty Usthads.
- **Mark Entry:** Class-wise and subject-wise score management with grading and teacher remarks.
- **Attendance Registry:** Daily present/absent tracking with one-click "Mark All Present".
- **View-Only Salary Slip:** Transparent access to basic pay, allowances, deductions, net salary, and payment status.
- **Profile Management:** Contact details and qualification updates.

### 3. 🏢 Office Administration ERP
- **Complete Madrassa Oversight:** Real-time statistics across all 12 classes and 24 sections.
- **Student Management:** Full census of all 303 students (149 boys, 154 girls) with active/inactive status toggle and section transfers.
- **Faculty & Payroll ERP:** Teacher designations, class assignments, basic pay setup, and monthly salary disbursement with slip generation.
- **Credential Control:** Office-level password reset and recovery for faculty and admin accounts.
- **Fee Management:** ₹100/month fee recording with payment tracking and receipt printing.
- **CMS & Website Settings:** Manage announcements, events, photo gallery, achievements, and hero banners.

---

## 📂 Academic Hierarchy & Census

- **Classes:** 12 Classes (Class 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, +1, +2)
- **Sections:** 24 Total Sections (Separate Boys & Girls Wings in every class)
- **Students:** 303 Active Students
  - **Boys:** 149
  - **Girls:** 154
- **Faculty:** 7 Usthads / Teachers

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** LibSQL / SQLite (`madrassa.db`)
- **Authentication:** Custom JWT-based Role Authentication with HTTP-Only Cookies
- **Security:** Anti-IDOR Token Binding, Role-Based Access Control (RBAC), bcryptjs Password Hashing

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/muhammedroshan246/Miftahul-Uloom-Madrassa-Nedumparambu-Portal.git
cd Miftahul-Uloom-Madrassa-Nedumparambu-Portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
JWT_SECRET="mifthahul_uloom_secure_jwt_secret_key_2026_madrassa"
MADRASSA_NAME="Mifthahul Uloom Higher Secondary Madrassa"
DATABASE_URL="file:./madrassa.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Portals & Access

| Portal | URL | Login Method | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Student Portal** | `/login?portal=student` | 3-Step Selection (No Password) | Select Class $\rightarrow$ Wing $\rightarrow$ Name |
| **Staff / Usthad** | `/login?portal=staff` | 6-Digit PIN | e.g. `naseeruddeen` / `482731` |
| **Office Admin** | `/login?portal=office` | Username + Password | `sadr` / `Sadr@5090` |

---

## 📄 License

Proprietary — Developed for **Mifthahul Uloom Higher Secondary Madrassa, Nedumparambu**. All rights reserved.
