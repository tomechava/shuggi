const bcrypt = require('bcrypt');

async function hashPasswords() {
  const adminPassword = await bcrypt.hash('Admin123*', 10);
  const storePassword = await bcrypt.hash('Store123*', 10);
  
  console.log('Admin password hash:', adminPassword);
  console.log('Store password hash:', storePassword);
}

hashPasswords();