import mongoose from 'mongoose';

const ServiceProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  experience: {
    type: Number, // years of experience
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean },
  },
  documents: {
    aadharCard: String, // URL to uploaded document
    panCard: String,
    experienceCertificate: String,
  },
  documentsVerified: {
    aadharCard: { type: Boolean, default: false },
    panCard: { type: Boolean, default: false },
    experienceCertificate: { type: Boolean, default: false },
  },
  price: {
    type: Number,
    default: 0,
  },
  discountedPrice: {
    type: Number,
    default: null,
  },
  profileImage: String,
  bio: String,
  languages: [String],
  specializations: [String],
}, {
  timestamps: true,
});

export default mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', ServiceProviderSchema);