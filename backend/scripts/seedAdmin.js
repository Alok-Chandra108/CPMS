require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || '11mt25mca082-t@mite.ac.in';
    const password = process.argv[2] || 'TempAdmin@123';
    const forceReset = process.argv.includes('--force');

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (!forceReset) {
        console.log(`ℹ️  Admin with email "${adminEmail}" already exists.`);
        console.log('   Run with --force to reset the password: node seedAdmin.js <newPassword> --force');
        process.exit(0);
      }

      // Force-reset: update password and re-flag mustChangePassword
      existingAdmin.password = password;
      existingAdmin.mustChangePassword = true;
      existingAdmin.refreshToken = null;
      await existingAdmin.save();

      console.log('----------------------------------------------------');
      console.log('🔄 Admin password has been reset.');
      console.log(`   Email   : ${adminEmail}`);
      console.log(`   Password: ${password}`);
      console.log('   mustChangePassword flag set to TRUE.');
      console.log('----------------------------------------------------');
      process.exit(0);
    }

    // Create fresh Super Admin
    const newAdmin = new Admin({
      fullName: 'Super Admin',
      email: adminEmail,
      password,
      role: 'admin',
      isVerified: true,
      mustChangePassword: true, // Force password change on first login
    });

    await newAdmin.save();

    console.log('----------------------------------------------------');
    console.log('🎉 Super Admin successfully created!');
    console.log(`   Email   : ${adminEmail}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  mustChangePassword is TRUE — change on first login!');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
