# Atlas
# The Living Atlas — Setup Guide

## Requirements

Before starting, make sure you have:

* **Node.js** installed
* **npm** installed

No separate database server is required.

---

## 1. Download the Project

Clone the repository:

```bash
git clone https://github.com/For-My-Dearest/Atlas.git
```

Then enter the project directory:

```bash
cd Atlas
```

Alternatively, you can download the repository as a ZIP from GitHub and extract it.

---

## 2. Install Dependencies

Inside the project directory, run:

```bash
npm install
```

This installs everything required to run the Atlas.

Then run:
```
npx prisma generate
```
---

## 3. Start the Application

Run:

```bash
npm run dev
```

Once the server starts, open:

```text
http://localhost:3000
```

The Atlas should now be running.

---

## 4. That's It

The repository already includes:

* The campaign database
* Environment configuration
* Campaign assets
* Uploaded media
* Application code

**You do not need to:**

* Create a database
* Configure SQLite
* Run database migrations
* Seed the database
* Create an `.env` file
* Import campaign data manually

Everything required by the campaign is already included.

---

## ⚠️ Important

### Do not reset the database

The included database contains the campaign's actual data.

Do **not** run commands such as:

```bash
npx prisma db push
```

or database seed/reset commands unless you specifically know why you are doing so.

Doing this may modify or overwrite the existing campaign data.

### Your copy is independent

If you downloaded the Atlas yourself, you have your own local copy of the campaign.

Changes you make to your copy will **not** automatically appear on anyone else's copy.

---

## Troubleshooting

### `npm` is not recognized

Node.js is either not installed or was not added to your system's PATH.

Install Node.js and restart your terminal.

### Port 3000 is already in use

Next.js may automatically use another available port. Check the terminal output for the address it provides.

### The application doesn't start

Make sure you are running the commands from the Atlas project directory:

```bash
cd Atlas
npm install
npm run dev
```

If the problem persists, send the **full terminal error** rather than just the last line.

---

## Quick Start

For someone who already has Node.js installed, the entire setup is simply:

```bash
git clone https://github.com/For-My-Dearest/Atlas.git
cd Atlas
npm install
npm run dev
```

Then open **http://localhost:3000**.

