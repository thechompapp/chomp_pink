// doof-backend/testPassword.js
import bcrypt from 'bcryptjs';

const password = 'newpass123';
const hash = '$2a$12$fuFXNDaEYkLks4k6aC.lFei2yrtopHuBWQ.zKwfe/Rt5Mg8baUzbu';

try {
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password match result:', isMatch);
} catch (err) {
  console.error('Error comparing password:', err);
}