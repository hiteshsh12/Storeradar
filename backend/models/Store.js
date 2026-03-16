const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electronics', 'Home Appliances', 'Clothing & Fashion',
      'Medicines & Health', 'Groceries', 'Toys & Games',
      'Hardware & Tools', 'Books & Stationery', 'Kitchen & Cookware',
      'Sports & Fitness', 'Beauty & Personal Care', 'Pet Supplies',
      'Art & Craft', 'Auto Parts', 'General'
    ]
  },
  address: {
    street:   { type: String, required: true },
    area:     { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true }
  },
  // GeoJSON point — required for $near queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],   // [longitude, latitude]
      required: true
    }
  },
  phone: { type: String },
  openHours: {
    open:  { type: String, default: '09:00' },
    close: { type: String, default: '21:00' },
    days:  { type: String, default: 'Mon–Sat' }
  },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

// 2dsphere index for geospatial queries
StoreSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', StoreSchema);
