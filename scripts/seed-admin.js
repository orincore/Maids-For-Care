const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true, trim: true },
  password: String,
  role: { type: String, default: 'super_admin' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: null },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'admin@maidsforcare.com';
  const existing = await Admin.findOne({ email });

  if (existing) {
    console.log(`Admin with email ${email} already exists (role: ${existing.role}). Skipping.`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash('Maidsforcare@7094', 12);

  await Admin.create({
    name: 'Admin',
    email,
    password: hashed,
    role: 'super_admin',
    isActive: true,
  });

  console.log(`✓ Admin created: ${email} (super_admin)`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
