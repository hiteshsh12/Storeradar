const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/products/search ─── THE MAIN SEARCH ENDPOINT ────
// Query: q (text), lat, lng, radius, category, pincode
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, radius = 5000, category, pincode } = req.query;

    if (!q) return res.status(400).json({ success: false, message: 'Search query (q) is required' });

    // Step 1: Find matching products by text search
    const productFilter = { $text: { $search: q }, inStock: true };
    if (category) productFilter.category = category;

    const matchingProducts = await Product.find(productFilter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .populate('store')
      .limit(100);

    if (matchingProducts.length === 0)
      return res.json({ success: true, count: 0, results: [] });

    // Step 2: Filter by location if lat/lng provided
    let results = matchingProducts;

    if (lat && lng) {
      const radiusMeters = Number(radius);
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      results = matchingProducts.filter(product => {
        if (!product.store || !product.store.location) return false;
        const [storeLng, storeLat] = product.store.location.coordinates;
        const dist = getDistanceMeters(userLat, userLng, storeLat, storeLng);
        product._distance = dist;
        return dist <= radiusMeters;
      });

      results.sort((a, b) => a._distance - b._distance);
    }

    if (pincode && !lat) {
      results = matchingProducts.filter(p => p.store && p.store.address.pincode === pincode);
    }

    // Step 3: Shape the response
    const formatted = results.map(p => ({
      productId: p._id,
      productName: p.name,
      brand: p.brand,
      modelNumber: p.modelNumber,
      price: p.price,
      mrp: p.mrp,
      quantity: p.quantity,
      inStock: p.inStock,
      store: p.store ? {
        id: p.store._id,
        name: p.store.name,
        category: p.store.category,
        address: p.store.address,
        phone: p.store.phone,
        openHours: p.store.openHours,
        coordinates: p.store.location?.coordinates
      } : null,
      distanceMeters: p._distance ? Math.round(p._distance) : null,
      distanceKm: p._distance ? (p._distance / 1000).toFixed(1) : null
    }));

    res.json({ success: true, count: formatted.length, results: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products ─── all products for a store ───────────
router.get('/', async (req, res) => {
  try {
    const { storeId, category, inStock } = req.query;
    const filter = {};
    if (storeId) filter.store = storeId;
    if (category) filter.category = category;
    if (inStock === 'true') filter.inStock = true;

    const products = await Product.find(filter).populate('store', 'name address');
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products ─── store owner adds a product ────────
router.post('/', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    // Verify the store belongs to this owner
    const store = await Store.findOne({ _id: req.body.store, owner: req.user._id });
    if (!store && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'You do not own this store' });

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/products/:id ─── update product / stock ─────────
router.put('/:id', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────
router.delete('/:id', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Haversine distance helper ─────────────────────────────────
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
