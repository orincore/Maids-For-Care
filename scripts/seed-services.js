const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const ServiceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  duration: Number,
  category: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

const services = [
  {
    name: 'Basic House Cleaning',
    description: 'Complete house cleaning including dusting, mopping, and bathroom cleaning',
    price: 500,
    duration: 3,
    category: 'cleaning',
  },
  {
    name: 'Deep Cleaning',
    description: 'Thorough deep cleaning of entire house including kitchen appliances and windows',
    price: 1200,
    duration: 6,
    category: 'cleaning',
  },
  {
    name: 'Daily Cooking',
    description: 'Preparation of daily meals including breakfast, lunch, and dinner',
    price: 800,
    duration: 4,
    category: 'cooking',
  },
  {
    name: 'Laundry Service',
    description: 'Washing, drying, and folding of clothes',
    price: 300,
    duration: 2,
    category: 'laundry',
  },
  {
    name: 'Child Care',
    description: 'Professional child care and supervision',
    price: 600,
    duration: 8,
    category: 'childcare',
  },
  {
    name: 'Elder Care',
    description: 'Caring for elderly family members including assistance with daily activities',
    price: 700,
    duration: 8,
    category: 'eldercare',
  },
  {
    name: 'Kitchen Deep Clean',
    description: 'Deep cleaning of kitchen including appliances, cabinets, and countertops',
    price: 400,
    duration: 2,
    category: 'cleaning',
  },
  {
    name: 'Party Cooking',
    description: 'Special occasion cooking for parties and events',
    price: 1500,
    duration: 6,
    category: 'cooking',
  },
];

async function seedServices() {
  try {
    // Clear existing services
    await Service.deleteMany({});
    
    // Insert new services
    await Service.insertMany(services);
    
    console.log('Services seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
}

seedServices();