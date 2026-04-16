const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const ServiceProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { street: String, city: String, state: String, zipCode: String },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  discountedPrice: { type: Number, default: null },
  profileImage: String,
  bio: String,
  languages: [String],
  specializations: [String],
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
    aadharCard: String,
    panCard: String,
    experienceCertificate: String,
  },
  documentsVerified: {
    aadharCard: { type: Boolean, default: false },
    panCard: { type: Boolean, default: false },
    experienceCertificate: { type: Boolean, default: false },
  },
}, { timestamps: true });

const avail = (days, start = '09:00', end = '18:00') => {
  const all = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  return Object.fromEntries(all.map(d => [d, { start: days.includes(d) ? start : '', end: days.includes(d) ? end : '', available: days.includes(d) }]));
};
const weekdays = ['monday','tuesday','wednesday','thursday','friday'];
const allDays  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// Updated existing 10 — all moved to Badlapur pincodes
const existingProviders = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@mfc.example.com',
    phone: '+91-9876543210',
    address: { street: '12, Shivaji Nagar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 5, rating: 4.8, totalReviews: 127,
    isVerified: true, isActive: true,
    price: 1200, discountedPrice: 999,
    bio: 'Experienced deep-cleaning specialist with 5+ years. Uses eco-friendly products.',
    languages: ['Hindi', 'English', 'Marathi'],
    specializations: ['Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Sanitization'],
    availability: avail(weekdays),
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@mfc.example.com',
    phone: '+91-9876543211',
    address: { street: '45, Ganesh Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 3, rating: 4.6, totalReviews: 89,
    isVerified: true, isActive: true,
    price: 1500, discountedPrice: null,
    bio: 'Professional cook specialising in North Indian and Continental cuisine.',
    languages: ['Hindi', 'English', 'Marathi'],
    specializations: ['North Indian Cuisine', 'Continental Food', 'Meal Prep'],
    availability: avail(allDays, '08:00', '20:00'),
  },
  {
    name: 'Anita Patel',
    email: 'anita.patel@mfc.example.com',
    phone: '+91-9876543212',
    address: { street: '78, Om Nagar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 7, rating: 4.9, totalReviews: 203,
    isVerified: true, isActive: true,
    price: 1800, discountedPrice: 1500,
    bio: 'Certified childcare professional trained in first aid and child development.',
    languages: ['English', 'Hindi', 'Marathi', 'Gujarati'],
    specializations: ['Infant Care', 'Toddler Activities', 'Educational Games'],
    availability: avail([...weekdays, 'saturday'], '07:00', '19:00'),
  },
  {
    name: 'Meera Deshmukh',
    email: 'meera.deshmukh@mfc.example.com',
    phone: '+91-9876543213',
    address: { street: '32, Katemanivali', city: 'Kalyan (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 4, rating: 4.7, totalReviews: 156,
    isVerified: true, isActive: true,
    price: 2000, discountedPrice: 1699,
    bio: 'Compassionate elder-care specialist with experience in medical assistance.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['Elder Care', 'Medical Assistance', 'Companionship'],
    availability: avail(allDays, '06:00', '22:00'),
  },
  {
    name: 'Vikram Jadhav',
    email: 'vikram.jadhav@mfc.example.com',
    phone: '+91-9876543214',
    address: { street: '65, Sai Nagar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 2, rating: 4.4, totalReviews: 67,
    isVerified: true, isActive: true,
    price: 800, discountedPrice: null,
    bio: 'Laundry & garment-care expert. Specialist in fabric care and stain removal.',
    languages: ['Hindi', 'Marathi'],
    specializations: ['Laundry Service', 'Dry Cleaning', 'Stain Removal'],
    availability: avail([...weekdays, 'saturday'], '08:00', '18:00'),
  },
  {
    name: 'Sunita Gaikwad',
    email: 'sunita.gaikwad@mfc.example.com',
    phone: '+91-9876543215',
    address: { street: '11, Manpada Road', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421502' },
    experience: 6, rating: 4.7, totalReviews: 141,
    isVerified: true, isActive: true,
    price: 1400, discountedPrice: 1199,
    bio: 'Full-home cleaning and cooking professional. Trusted by families across Badlapur.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['General Cleaning', 'Cooking', 'Grocery Management'],
    availability: avail(weekdays),
  },
  {
    name: 'Kavitha Nair',
    email: 'kavitha.nair@mfc.example.com',
    phone: '+91-9876543216',
    address: { street: '88, Vasant Vihar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 8, rating: 4.9, totalReviews: 218,
    isVerified: true, isActive: true,
    price: 2200, discountedPrice: 1899,
    bio: 'Senior nanny and household manager with 8 years experience. CPR certified.',
    languages: ['Malayalam', 'English', 'Hindi', 'Marathi'],
    specializations: ['Child Care', 'Household Management', 'Tutoring Support'],
    availability: avail([...weekdays, 'saturday'], '07:00', '20:00'),
  },
  {
    name: 'Pooja Shinde',
    email: 'pooja.shinde@mfc.example.com',
    phone: '+91-9876543217',
    address: { street: '5, Vitthal Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421502' },
    experience: 3, rating: 4.5, totalReviews: 74,
    isVerified: false, isActive: true,
    price: 900, discountedPrice: null,
    bio: 'Reliable general maid available for daily household chores including cleaning and laundry.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['General Cleaning', 'Laundry', 'Dusting & Mopping'],
    availability: avail(weekdays, '08:00', '17:00'),
  },
  {
    name: 'Lakshmi Patil',
    email: 'lakshmi.patil@mfc.example.com',
    phone: '+91-9876543218',
    address: { street: '22, Apna Ghar Colony', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 10, rating: 5.0, totalReviews: 312,
    isVerified: true, isActive: true,
    price: 2500, discountedPrice: 2199,
    bio: 'Decade of experience in premium household management. Expert in Maharashtrian cooking.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['Maharashtrian Cooking', 'Deep Cleaning', 'Elder Care', 'Infant Care'],
    availability: avail(allDays, '06:00', '21:00'),
  },
  {
    name: 'Rekha Gupta',
    email: 'rekha.gupta@mfc.example.com',
    phone: '+91-9876543219',
    address: { street: '9, Saraswati Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 4, rating: 4.6, totalReviews: 98,
    isVerified: true, isActive: true,
    price: 1100, discountedPrice: 899,
    bio: 'Versatile maid available for cooking, cleaning and childcare. Available on short notice.',
    languages: ['Hindi', 'Marathi', 'English'],
    specializations: ['Cooking', 'Cleaning', 'Child Care', 'Grocery Shopping'],
    availability: avail([...weekdays, 'saturday']),
  },
];

// 10 brand-new providers — Badlapur / Ambernath area (421501 / 421502 / 421503)
const newProviders = [
  {
    name: 'Sangeeta More',
    email: 'sangeeta.more@mfc.example.com',
    phone: '+91-9123456701',
    address: { street: '3, Indira Nagar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 5, rating: 4.6, totalReviews: 112,
    isVerified: true, isActive: true,
    price: 1300, discountedPrice: 1099,
    bio: 'Dedicated full-time maid with expertise in home management and cooking.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['General Cleaning', 'Cooking', 'Utensil Cleaning'],
    availability: avail(weekdays),
  },
  {
    name: 'Archana Bhosale',
    email: 'archana.bhosale@mfc.example.com',
    phone: '+91-9123456702',
    address: { street: '17, Subhash Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 3, rating: 4.4, totalReviews: 55,
    isVerified: true, isActive: true,
    price: 950, discountedPrice: null,
    bio: 'Reliable part-time maid specialising in sweeping, mopping and dusting.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['Sweeping', 'Mopping', 'Dusting'],
    availability: avail(weekdays, '07:00', '13:00'),
  },
  {
    name: 'Urmila Kamble',
    email: 'urmila.kamble@mfc.example.com',
    phone: '+91-9123456703',
    address: { street: '6, Ambedkar Road', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421502' },
    experience: 7, rating: 4.8, totalReviews: 189,
    isVerified: true, isActive: true,
    price: 1700, discountedPrice: 1499,
    bio: 'Experienced cook and caretaker. Specialises in infant and elder care.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['Infant Care', 'Elder Care', 'Cooking'],
    availability: avail([...weekdays, 'saturday'], '08:00', '20:00'),
  },
  {
    name: 'Nanda Wagh',
    email: 'nanda.wagh@mfc.example.com',
    phone: '+91-9123456704',
    address: { street: '29, New Colony', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 2, rating: 4.3, totalReviews: 38,
    isVerified: false, isActive: true,
    price: 750, discountedPrice: null,
    bio: 'Energetic part-time helper available for daily cleaning and dishwashing.',
    languages: ['Marathi'],
    specializations: ['Dishwashing', 'Floor Cleaning', 'Clothes Washing'],
    availability: avail(weekdays, '06:00', '12:00'),
  },
  {
    name: 'Savita Salunkhe',
    email: 'savita.salunkhe@mfc.example.com',
    phone: '+91-9123456705',
    address: { street: '14, Ganpati Chowk', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 6, rating: 4.7, totalReviews: 134,
    isVerified: true, isActive: true,
    price: 1600, discountedPrice: 1349,
    bio: 'Full-day maid with strong cooking skills — Maharashtrian and North Indian.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['Maharashtrian Cooking', 'Deep Cleaning', 'Laundry'],
    availability: avail(allDays, '07:00', '19:00'),
  },
  {
    name: 'Parvati Jagtap',
    email: 'parvati.jagtap@mfc.example.com',
    phone: '+91-9123456706',
    address: { street: '41, Vitthal Mandir Road', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 9, rating: 4.9, totalReviews: 267,
    isVerified: true, isActive: true,
    price: 2300, discountedPrice: 1999,
    bio: 'Senior household professional with 9 years experience. Trusted by premium households.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['Household Management', 'Cooking', 'Elder Care', 'Deep Cleaning'],
    availability: avail([...weekdays, 'saturday'], '06:00', '20:00'),
  },
  {
    name: 'Geeta Mhatre',
    email: 'geeta.mhatre@mfc.example.com',
    phone: '+91-9123456707',
    address: { street: '8, Shanti Park', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421502' },
    experience: 4, rating: 4.5, totalReviews: 79,
    isVerified: true, isActive: true,
    price: 1050, discountedPrice: 899,
    bio: 'Cheerful and hardworking maid. Available for morning and evening shifts.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['General Cleaning', 'Utensil Cleaning', 'Grocery Support'],
    availability: avail(weekdays),
  },
  {
    name: 'Vandana Nikam',
    email: 'vandana.nikam@mfc.example.com',
    phone: '+91-9123456708',
    address: { street: '55, Rajiv Gandhi Nagar', city: 'Badlapur (W)', state: 'Maharashtra', zipCode: '421503' },
    experience: 5, rating: 4.6, totalReviews: 103,
    isVerified: true, isActive: true,
    price: 1250, discountedPrice: null,
    bio: 'Specialises in baby care, cooking, and full home management for working couples.',
    languages: ['Marathi', 'Hindi', 'English'],
    specializations: ['Baby Care', 'Cooking', 'Home Management'],
    availability: avail([...weekdays, 'saturday'], '08:00', '18:00'),
  },
  {
    name: 'Sushila Talekar',
    email: 'sushila.talekar@mfc.example.com',
    phone: '+91-9123456709',
    address: { street: '19, Laxmi Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421501' },
    experience: 8, rating: 4.8, totalReviews: 176,
    isVerified: true, isActive: true,
    price: 1900, discountedPrice: 1649,
    bio: 'Expert in senior citizen care and post-surgery assistance. Certified first aid.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['Elder Care', 'Post-Surgery Assistance', 'Medical Help'],
    availability: avail(allDays, '06:00', '22:00'),
  },
  {
    name: 'Mangal Pawar',
    email: 'mangal.pawar@mfc.example.com',
    phone: '+91-9123456710',
    address: { street: '33, Hanuman Nagar', city: 'Badlapur (E)', state: 'Maharashtra', zipCode: '421502' },
    experience: 3, rating: 4.4, totalReviews: 61,
    isVerified: false, isActive: true,
    price: 850, discountedPrice: null,
    bio: 'Punctual and responsible maid for daily sweeping, mopping and cooking assistance.',
    languages: ['Marathi', 'Hindi'],
    specializations: ['Sweeping', 'Cooking Assistance', 'Laundry'],
    availability: avail(weekdays, '07:00', '14:00'),
  },
];

const sampleProviders = [...existingProviders, ...newProviders];

async function seedProviders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌  MONGODB_URI not found in .env'); process.exit(1); }

  try {
    console.log('🔌  Connecting to MongoDB…');
    await mongoose.connect(uri);
    console.log('✅  Connected');

    delete mongoose.models.ServiceProvider;
    const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);

    console.log('🗑   Clearing existing service providers…');
    await ServiceProvider.deleteMany({});

    // Drop stale unique index on providerId if it exists
    try {
      await mongoose.connection.collection('serviceproviders').dropIndex('providerId_1');
      console.log('🧹  Dropped stale providerId_1 index');
    } catch (_) {
      // Index doesn't exist — that's fine
    }

    console.log('📥  Inserting 10 dummy service providers…');
    const inserted = await ServiceProvider.insertMany(sampleProviders);

    console.log(`\n✅  Inserted ${inserted.length} providers:\n`);
    inserted.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} — ${p.address.city} — ₹${p.price}${p.discountedPrice ? ` (offer ₹${p.discountedPrice})` : ''}`));
  } catch (err) {
    console.error('❌  Seeding error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌  Connection closed');
  }
}

seedProviders();