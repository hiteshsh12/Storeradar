const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/stores ─── list all stores (admin / public browse)
router.get('/', async (req, res) => {
  try {
    const { city, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (category) filter.category = category;

    const stores = await Store.find(filter)
      .populate('owner', 'name email phone')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Store.countDocuments(filter);

    res.json({ success: true, count: stores.length, total, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/stores/nearby ─── geospatial nearby search ──────
// Query params: lat, lng, radius (meters, default 5000), category
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, category } = req.query;

    if (!lat || !lng)
      return res.status(400).json({ success: false, message: 'lat and lng are required' });

    const filter = {
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: Number(radius)
        }
      }
    };
    if (category) filter.category = category;

    const stores = await Store.find(filter)
      .populate('owner', 'name phone')
      .limit(50);

    res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/stores/:id ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('owner', 'name email phone');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/stores ─── register a new store ────────────────
router.post('/', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    const storeData = { ...req.body, owner: req.user._id };
    const store = await Store.create(storeData);
    res.status(201).json({ success: true, data: store });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/stores/:id ───────────────────────────────────────
router.put('/:id', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    // Only owner or admin can update
    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/stores/:id ────────────────────────────────────
router.delete('/:id', protect, authorize('store_owner', 'admin'), async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await store.deleteOne();
    res.json({ success: true, message: 'Store deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
