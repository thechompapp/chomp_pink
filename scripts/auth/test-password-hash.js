import bcrypt from 'bcryptjs';

async function testPasswordHashing() {
  const password = 'testpassword123';
  
  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Generated hash:', hash);
  console.log('Hash length:', hash.length);
  
  // Verify the password
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password matches hash:', isMatch);
  
  // Try with the hash we're seeing in the database
  const dbHash = 'bVnG6.mfvsy5z.XtZ9c68euO3KmmXxAvYTEk5dPkRbkxZivDJgYqu';
  const fullHash = '$2b$10$' + dbHash;
  console.log('Full hash from DB:', fullHash);
  
  try {
    const isMatchDb = await bcrypt.compare(password, fullHash);
    console.log('Password matches DB hash:', isMatchDb);
  } catch (error) {
    console.error('Error comparing with DB hash:', error.message);
  }
}

testPasswordHashing().catch(console.error);
