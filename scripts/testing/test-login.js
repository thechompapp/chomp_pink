import http from 'http';

const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'testpassword123' // This might need to be updated if the password is different
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 10000
};

console.log('Sending login request...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', responseBody);
    
    if (res.statusCode === 200) {
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        console.log('Login successful! Cookies:', cookies);
      }
    }
    
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
  process.exit(1);
});

// Write data to request body
req.write(postData);
req.end();
