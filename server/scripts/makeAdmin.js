require('dotenv-safe').config({ example: './.env.example' });
const bcrypt = require('bcrypt');
const sequelize = require('../db');
const { User } = require('../models/models');

async function main() {
  const email = (process.argv.find(a => a.startsWith('--email=')) || '').split('=')[1];
  const password = (process.argv.find(a => a.startsWith('--password=')) || '').split('=')[1] || 'admin12345';
  const name = (process.argv.find(a => a.startsWith('--name=')) || '').split('=')[1] || 'Admin';

  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js --email=me@example.com --password=secret --name="Admin User"');
    process.exit(1);
  }

  await sequelize.authenticate();

  let user = await User.findOne({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash(password, 12);
    user = await User.create({
      name,
      email,
      password: hash,
      role: 'ADMIN',
      phone: '+70000000000',
      phoneVerified: true,
      isVerified: true,
      // триал/подписка опционально:
      // subscriptionStatus: 'active',
      // subscriptionEndsAt: new Date(Date.now() + 30*24*3600*1000),
    });
    console.log('Created admin:', user.id, user.email);
  } else {
    user.role = 'ADMIN';
    await user.save();
    console.log('Updated role to ADMIN for:', user.id, user.email);
  }

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
