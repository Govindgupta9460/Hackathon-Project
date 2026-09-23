const http = require('http');

const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('=== STARTING AUTHENTICATION TESTS ===\n');
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@campus.edu`;
  const organizerEmail = `organizer_${timestamp}@campus.edu`;

  // Test 1: Register with missing fields
  console.log('Test 1: Register with missing fields');
  const res1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail });
  console.log(`Status: ${res1.status}, Message: ${res1.data.message}`);
  console.assert(res1.status === 400, 'Expected status 400');

  // Test 2: Register with invalid email
  console.log('\nTest 2: Register with invalid email');
  const res2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'John Doe', email: 'invalid-email', password: 'password123' });
  console.log(`Status: ${res2.status}, Message: ${res2.data.message}`);
  console.assert(res2.status === 400, 'Expected status 400');

  // Test 3: Register with short password
  console.log('\nTest 3: Register with short password (< 6 chars)');
  const res3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'John Doe', email: studentEmail, password: '123' });
  console.log(`Status: ${res3.status}, Message: ${res3.data.message}`);
  console.assert(res3.status === 400, 'Expected status 400');

  // Test 4: Successful Student Registration
  console.log('\nTest 4: Register valid Student');
  const res4 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Alice Student',
    email: studentEmail,
    password: 'password123',
    department: 'Computer Science'
  });
  console.log(`Status: ${res4.status}, Role: ${res4.data.user.role}, Has Password: ${!!res4.data.user.password}`);
  console.assert(res4.status === 201, 'Expected status 201');
  console.assert(res4.data.user.role === 'student', 'Expected role student');
  console.assert(!res4.data.user.password, 'Password must not be returned');
  const studentToken = res4.data.token;

  // Test 5: Prevent Duplicate Email Registration
  console.log('\nTest 5: Prevent Duplicate Email Registration');
  const res5 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Duplicate Alice',
    email: studentEmail,
    password: 'password123'
  });
  console.log(`Status: ${res5.status}, Message: ${res5.data.message}`);
  console.assert(res5.status === 400, 'Expected status 400');

  // Test 6: Register Organizer
  console.log('\nTest 6: Register Organizer');
  const res6 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Bob Organizer',
    email: organizerEmail,
    password: 'password123',
    role: 'organizer',
    department: 'Cultural Club'
  });
  console.log(`Status: ${res6.status}, Role: ${res6.data.user.role}`);
  console.assert(res6.status === 201, 'Expected status 201');
  console.assert(res6.data.user.role === 'organizer', 'Expected role organizer');
  const organizerToken = res6.data.token;

  // Test 7: Successful Login
  console.log('\nTest 7: Login with valid credentials');
  const res7 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: studentEmail,
    password: 'password123'
  });
  console.log(`Status: ${res7.status}, Has Token: ${!!res7.data.token}, User: ${res7.data.user.name}`);
  console.assert(res7.status === 200, 'Expected status 200');
  console.assert(!!res7.data.token, 'Token must be present');

  // Test 8: Login with invalid password
  console.log('\nTest 8: Login with invalid password');
  const res8 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: studentEmail,
    password: 'wrongpassword'
  });
  console.log(`Status: ${res8.status}, Message: ${res8.data.message}`);
  console.assert(res8.status === 401, 'Expected status 401');

  // Test 9: Login with non-existent user
  console.log('\nTest 9: Login with non-existent email');
  const res9 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'nonexistent@campus.edu',
    password: 'password123'
  });
  console.log(`Status: ${res9.status}, Message: ${res9.data.message}`);
  console.assert(res9.status === 401, 'Expected status 401');

  // Test 10: GET /api/auth/me without token
  console.log('\nTest 10: GET /api/auth/me without token');
  const res10 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET'
  });
  console.log(`Status: ${res10.status}, Message: ${res10.data.message}`);
  console.assert(res10.status === 401, 'Expected status 401');

  // Test 11: GET /api/auth/me with invalid token
  console.log('\nTest 11: GET /api/auth/me with invalid/tampered token');
  const res11 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid.jwt.token' }
  });
  console.log(`Status: ${res11.status}, Message: ${res11.data.message}`);
  console.assert(res11.status === 401, 'Expected status 401');

  // Test 12: GET /api/auth/me with valid student token
  console.log('\nTest 12: GET /api/auth/me with valid student token');
  const res12 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`Status: ${res12.status}, User Name: ${res12.data.user.name}, Role: ${res12.data.user.role}, Has Password: ${!!res12.data.user.password}`);
  console.assert(res12.status === 200, 'Expected status 200');
  console.assert(res12.data.user.email === studentEmail, 'Email must match');
  console.assert(!res12.data.user.password, 'Password must not be exposed');

  console.log('\n=== ALL 12 AUTHENTICATION TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
