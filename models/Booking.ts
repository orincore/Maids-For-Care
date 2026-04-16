import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }], // Array for multiple service selection
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String,
  orderId: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  specialInstructions: String,
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  estimatedCompletionTime: Date,
  actualCompletionTime: Date,
  beforeImages: [String], // URLs to images
  afterImages: [String], // URLs to images
  workNotes: String, // Notes from service provider
  customerNotes: String, // Notes from customer
  isReviewSubmitted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

delete (mongoose.models as any).Booking;
export default mongoose.model('Booking', BookingSchema);