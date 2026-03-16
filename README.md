# 📡 StoreRadar — Full Stack Setup Guide

## Project Structure
```
storeradar/
├── frontend/
│   └── storeradar.html          ← Your website (open in browser)
├── backend/
│   ├── server.js                ← Main entry point
│   ├── .env                     ← Your environment variables
│   ├── package.json
│   ├── config/
│   │   └── db.js                ← MongoDB connection
│   ├── models/
│   │   ├── User.js              ← Shoppers & store owners
│   │   ├── Store.js             ← Store with geo-location
│   │   └── Product.js           ← Inventory with text search
│   ├── routes/
│   │   ├── auth.js              ← Register / Login / Me
│   │   ├── stores.js            ← Store CRUD + nearby search
│   │   └── products.js          ← Product CRUD + text search
│   └── middleware/
│       └── auth.js              ← JWT protection
└── README.md
```

---

## Step 1 — Get a free MongoDB database

1. Go to **https://www.mongodb.com/atlas** → Create free account
2. Create a free **M0 cluster**
3. Click **Connect → Drivers** → copy the connection string
4. It looks like:  
   `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/storeradar`

---

## Step 2 — Set up the backend

```bash
# Open terminal in VS Code (Ctrl + `)
cd backend

# Install dependencies
npm install

# Edit the .env file — paste your MongoDB URI
# Open .env in VS Code and replace MONGO_URI

# Start the server
npm run dev
```

You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 StoreRadar server running on http://localhost:5000
```

---

## Step 3 — Open the frontend

Just open `frontend/storeradar.html` in your browser.

Or install the **Live Server** extension in VS Code:
- Right-click `storeradar.html` → **Open with Live Server**

---

## API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register shopper or store owner |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user (requires token) |

### Stores
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/stores` | List all stores |
| GET | `/api/stores/nearby?lat=&lng=&radius=` | Stores near a location |
| GET | `/api/stores/:id` | Single store |
| POST | `/api/stores` | Register new store (store_owner only) |
| PUT | `/api/stores/:id` | Update store |
| DELETE | `/api/stores/:id` | Delete store |

### Products & Search
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products/search?q=&lat=&lng=` | **Main search** — find product nearby |
| GET | `/api/products?storeId=` | All products for a store |
| POST | `/api/products` | Add product (store_owner only) |
| PUT | `/api/products/:id` | Update product/stock |
| DELETE | `/api/products/:id` | Delete product |

---

## Example: Register a store owner and add a store

```bash
# 1. Register as store owner
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "password": "secret123",
    "role": "store_owner"
  }'

# 2. Copy the token from the response

# 3. Create a store (replace TOKEN below)
curl -X POST http://localhost:5000/api/stores \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Electronics",
    "category": "Electronics",
    "address": {
      "street": "12 Market Road",
      "area": "Lajpat Nagar",
      "city": "New Delhi",
      "state": "Delhi",
      "pincode": "110024"
    },
    "location": {
      "type": "Point",
      "coordinates": [77.2369, 28.5700]
    },
    "phone": "9876543210",
    "openHours": { "open": "10:00", "close": "21:00", "days": "Mon–Sat" }
  }'

# 4. Add a product to that store (replace STORE_ID and TOKEN)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store": "STORE_ID",
    "name": "Sony WH-1000XM5",
    "brand": "Sony",
    "modelNumber": "WH1000XM5",
    "category": "Electronics",
    "price": 29990,
    "mrp": 32990,
    "quantity": 5,
    "tags": ["headphones", "wireless", "noise cancelling", "sony"]
  }'
```

---

## When you're ready to go live

1. Deploy backend to **Railway** (free) — https://railway.app
2. Change `API_BASE` in `storeradar.html` from `http://localhost:5000/api` to your Railway URL
3. Host frontend on **Netlify** (free) — drag and drop the HTML file

That's it — StoreRadar is live! 🚀
