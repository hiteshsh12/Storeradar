const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  modelNumber: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  mrp: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    default: 'piece'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  tags: [{ type: String, lowercase: true }],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-set inStock based on quantity
ProductSchema.pre('save', function (next) {
  this.inStock = this.quantity > 0;
  this.updatedAt = Date.now();
  next();
});

// Text index for search
ProductSchema.index({
  name: 'text',
  brand: 'text',
  modelNumber: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: { name: 10, brand: 5, modelNumber: 8, tags: 4, description: 1 }
});

module.exports = mongoose.model('Product', ProductSchema);
