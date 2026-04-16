import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    default: null, // null means no discount
  },
  duration: {
    type: Number, // in hours
    required: true,
  },
  category: {
    type: String,
    enum: ['cleaning', 'cooking', 'laundry', 'childcare', 'eldercare', 'general'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);