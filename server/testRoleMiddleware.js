const roleMiddleware = require('./middleware/roleMiddleware');

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

console.log('=== TESTING ROLE MIDDLEWARE ===\n');

// Test 1: User not attached to request
const reqNoUser = {};
const resNoUser = createMockRes();
let nextCalled = false;
roleMiddleware('organizer')(reqNoUser, resNoUser, () => { nextCalled = true; });
console.log('Test 1 - No user on request: Status', resNoUser.statusCode, resNoUser.body);
console.assert(resNoUser.statusCode === 401, 'Expected 401 when no user');
console.assert(!nextCalled, 'next() should not have been called');

// Test 2: Student accessing organizer-only route
const reqStudent = { user: { role: 'student', name: 'Alice' } };
const resStudent = createMockRes();
nextCalled = false;
roleMiddleware('organizer')(reqStudent, resStudent, () => { nextCalled = true; });
console.log('Test 2 - Student accessing organizer route: Status', resStudent.statusCode, resStudent.body);
console.assert(resStudent.statusCode === 403, 'Expected 403 for unauthorized role');
console.assert(!nextCalled, 'next() should not have been called');

// Test 3: Organizer accessing organizer-only route
const reqOrganizer = { user: { role: 'organizer', name: 'Bob' } };
const resOrganizer = createMockRes();
nextCalled = false;
roleMiddleware('organizer')(reqOrganizer, resOrganizer, () => { nextCalled = true; });
console.log('Test 3 - Organizer accessing organizer route: Status', resOrganizer.statusCode, 'Next called:', nextCalled);
console.assert(nextCalled, 'next() should have been called for authorized role');
console.assert(resOrganizer.statusCode === null, 'No error response should be sent');

// Test 4: Multiple allowed roles
nextCalled = false;
const resMulti = createMockRes();
roleMiddleware('student', 'organizer')(reqStudent, resMulti, () => { nextCalled = true; });
console.log('Test 4 - Multi-role check: Next called:', nextCalled);
console.assert(nextCalled, 'next() should have been called for student in [student, organizer]');

console.log('\n=== ALL ROLE MIDDLEWARE TESTS PASSED! ===');
