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

async function runRegistrationTests() {
  console.log('=== STARTING REGISTRATION MODULE TESTS ===\n');
  const timestamp = Date.now();

  const results = [];
  const logResult = (num, testName, expected, actual, passed, details = '') => {
    results.push({ num, testName, expected, actual, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Test ${num}: ${testName}`);
    console.log(`        Expected: ${expected}`);
    console.log(`        Actual:   ${actual}`);
    if (details) console.log(`        Details:  ${details}`);
    console.log('');
  };

  // Setup: Register 2 Organizers and 3 Students
  const org1Email = `reg_org1_${timestamp}@campus.edu`;
  const org2Email = `reg_org2_${timestamp}@campus.edu`;
  const stud1Email = `reg_stud1_${timestamp}@campus.edu`;
  const stud2Email = `reg_stud2_${timestamp}@campus.edu`;
  const stud3Email = `reg_stud3_${timestamp}@campus.edu`;

  // Register Organizer 1
  const regOrg1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Org One', email: org1Email, password: 'password123', role: 'organizer' });
  const tokenOrg1 = regOrg1.data.token;
  const org1Id = regOrg1.data.user._id;

  // Register Organizer 2
  const regOrg2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Org Two', email: org2Email, password: 'password123', role: 'organizer' });
  const tokenOrg2 = regOrg2.data.token;

  // Register Student 1
  const regStud1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Student One', email: stud1Email, password: 'password123', role: 'student', department: 'CS' });
  const tokenStud1 = regStud1.data.token;
  const stud1Id = regStud1.data.user._id;

  // Register Student 2
  const regStud2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Student Two', email: stud2Email, password: 'password123', role: 'student', department: 'EE' });
  const tokenStud2 = regStud2.data.token;
  const stud2Id = regStud2.data.user._id;

  // Register Student 3
  const regStud3 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Student Three', email: stud3Email, password: 'password123', role: 'student', department: 'Mech' });
  const tokenStud3 = regStud3.data.token;
  const stud3Id = regStud3.data.user._id;

  // Create an upcoming event with Capacity = 2 by Organizer 1
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const eventCapacity2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, {
    title: 'Limited Workshop',
    description: 'Workshop with strictly 2 seats',
    category: 'Workshop',
    date: futureDate,
    time: '10:00 AM',
    venue: 'Lab A',
    capacity: 2
  });
  const event2Id = eventCapacity2.data.event._id;

  // Create an event with past date by Organizer 1 (for testing past event rejection)
  // We can insert a past date event
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const pastEvent = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, {
    title: 'Past Seminar',
    description: 'Yesterday event',
    category: 'Technical',
    date: pastDate,
    time: '10:00 AM',
    venue: 'Hall B',
    capacity: 50
  });
  const pastEventId = pastEvent.data.event._id;

  // Create an event by Organizer 2
  const org2Event = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg2}` }
  }, {
    title: 'Org 2 Cultural Fest',
    description: 'Music Fest',
    category: 'Cultural',
    date: futureDate,
    time: '05:00 PM',
    venue: 'Auditorium',
    capacity: 200
  });
  const org2EventId = org2Event.data.event._id;

  // Test 3: Student successfully registers
  const resReg1 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  const reg1Id = resReg1.data.registration ? resReg1.data.registration._id : null;
  logResult(
    3, 'Student successfully registers',
    'Status 201 with status="registered"',
    `Status ${resReg1.status}, Registration status: ${resReg1.data.registration ? resReg1.data.registration.status : 'none'}`,
    resReg1.status === 201 && resReg1.data.registration && resReg1.data.registration.status === 'registered'
  );

  // Test 4: Student cannot register twice
  const resRegDup = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    4, 'Student cannot register twice',
    'Status 400 (You are already registered for this event)',
    `Status ${resRegDup.status} (${resRegDup.data.message})`,
    resRegDup.status === 400 && resRegDup.data.message === 'You are already registered for this event'
  );

  // Test 5: Organizer cannot register as student
  const resOrgReg = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenOrg1}` }
  });
  logResult(
    5, 'Organizer cannot register as student',
    'Status 403 Forbidden',
    `Status ${resOrgReg.status} (${resOrgReg.data.message})`,
    resOrgReg.status === 403
  );

  // Test 6: Unauthenticated user cannot register
  const resNoAuth = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST'
  });
  logResult(
    6, 'Unauthenticated user cannot register',
    'Status 401 Unauthorized',
    `Status ${resNoAuth.status} (${resNoAuth.data.message})`,
    resNoAuth.status === 401
  );

  // Test 7: Invalid event ID
  const resInvalidEvent = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/invalid-id-123', method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud2}` }
  });
  logResult(
    7, 'Invalid event ID format',
    'Status 400 Bad Request',
    `Status ${resInvalidEvent.status} (${resInvalidEvent.data.message})`,
    resInvalidEvent.status === 400
  );

  // Test 8: Non-existent event
  const fakeEventId = '507f1f77bcf86cd799439011';
  const resNonExistent = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${fakeEventId}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud2}` }
  });
  logResult(
    8, 'Non-existent event registration',
    'Status 404 Event not found',
    `Status ${resNonExistent.status} (${resNonExistent.data.message})`,
    resNonExistent.status === 404
  );

  // Test 9: Registration for past event rejected
  const resPast = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${pastEventId}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud2}` }
  });
  logResult(
    9, 'Registration for past event rejected',
    'Status 400 Bad Request',
    `Status ${resPast.status} (${resPast.data.message})`,
    resPast.status === 400
  );

  // Test 10: Full event rejected (Capacity = 2: Student 2 registers successfully, Student 3 rejected)
  const resReg2 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud2}` }
  });
  const resReg3Full = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud3}` }
  });
  logResult(
    10, 'Full event capacity rejection (Capacity=2)',
    'Seat 2 -> Status 201, Seat 3 -> Status 400 Event has reached maximum capacity',
    `Seat 2: ${resReg2.status}, Seat 3: ${resReg3Full.status} (${resReg3Full.data.message})`,
    resReg2.status === 201 && resReg3Full.status === 400 && resReg3Full.data.message.includes('capacity')
  );
  const reg2Id = resReg2.data.registration ? resReg2.data.registration._id : null;

  // Test 11: Student can view own registrations
  const resMyRegs = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/my-registrations', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  const hasPopulatedEvent = resMyRegs.data.registrations && resMyRegs.data.registrations.length > 0 && !!resMyRegs.data.registrations[0].event.title;
  logResult(
    11, 'Student can view own registrations with populated event details',
    'Status 200 with populated event details',
    `Status ${resMyRegs.status}, Count: ${resMyRegs.data.count}, Has Event Details: ${hasPopulatedEvent}`,
    resMyRegs.status === 200 && hasPopulatedEvent
  );

  // Test 12: Student cannot view organizer registration endpoint
  const resStudViewOrgEndpoint = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/event/${event2Id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    12, 'Student cannot view organizer registration endpoint',
    'Status 403 Forbidden',
    `Status ${resStudViewOrgEndpoint.status} (${resStudViewOrgEndpoint.data.message})`,
    resStudViewOrgEndpoint.status === 403
  );

  // Test 13: Organizer can view registrations for own event
  const resOrgViewOwn = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/event/${event2Id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg1}` }
  });
  const studentsSafe = resOrgViewOwn.data.registrations && resOrgViewOwn.data.registrations.every(r => r.student.name && !r.student.password);
  logResult(
    13, 'Organizer can view registrations for own event (safe student details)',
    'Status 200, count=2, students without passwords',
    `Status ${resOrgViewOwn.status}, Count: ${resOrgViewOwn.data.count}, Safe Student Info: ${studentsSafe}`,
    resOrgViewOwn.status === 200 && resOrgViewOwn.data.count === 2 && studentsSafe
  );

  // Test 14: Organizer cannot view another organizer's event registrations
  const resOrgViewOther = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/event/${org2EventId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg1}` }
  });
  logResult(
    14, "Organizer cannot view another organizer's event registrations",
    'Status 403 Forbidden',
    `Status ${resOrgViewOther.status} (${resOrgViewOther.data.message})`,
    resOrgViewOther.status === 403
  );

  // Test 15: Student can cancel own registration
  const resCancelOwn = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${reg1Id}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    15, 'Student can cancel own registration',
    'Status 200 Registration cancelled successfully',
    `Status ${resCancelOwn.status} (${resCancelOwn.data.message})`,
    resCancelOwn.status === 200 && resCancelOwn.data.registration.status === 'cancelled'
  );

  // Test 16: Student cannot cancel another student's registration
  const resCancelOther = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${reg2Id}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    16, "Student cannot cancel another student's registration",
    'Status 403 Forbidden',
    `Status ${resCancelOther.status} (${resCancelOther.data.message})`,
    resCancelOther.status === 403
  );

  // Test 17: Invalid registration ID format
  const resInvalidRegId = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/invalid-reg-id', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    17, 'Invalid registration ID format',
    'Status 400 Bad Request',
    `Status ${resInvalidRegId.status} (${resInvalidRegId.data.message})`,
    resInvalidRegId.status === 400
  );

  // Test 18: Non-existent registration ID
  const fakeRegId = '507f1f77bcf86cd799439011';
  const resNonExistentReg = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${fakeRegId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  logResult(
    18, 'Non-existent registration cancellation',
    'Status 404 Registration not found',
    `Status ${resNonExistentReg.status} (${resNonExistentReg.data.message})`,
    resNonExistentReg.status === 404
  );

  // Test 19: Capacity becomes available after cancellation
  // Student 1 cancelled their seat above, so capacity should now be 1/2.
  // Student 3 (who was previously rejected) should now be able to register successfully!
  const resReg3AfterCancel = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${event2Id}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud3}` }
  });
  logResult(
    19, 'Capacity becomes available after cancellation (Student 3 claims freed seat)',
    'Status 201 Registration successful',
    `Status ${resReg3AfterCancel.status} (${resReg3AfterCancel.data.message})`,
    resReg3AfterCancel.status === 201 && resReg3AfterCancel.data.registration.status === 'registered'
  );

  // Test 20: Student ID is taken from JWT and cannot be spoofed
  // Student 3 registers for Org 2's event, passing a spoofed student ID in the body
  const spoofedId = '507f1f77bcf86cd799439099';
  const resSpoof = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${org2EventId}`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStud3}` }
  }, { student: spoofedId });
  const actualAssignedStudent = resSpoof.data.registration ? resSpoof.data.registration.student : null;
  logResult(
    20, 'Student ID is taken from JWT and cannot be spoofed from body',
    `Status 201, registration.student === Student 3 ID (${stud3Id})`,
    `Status ${resSpoof.status}, Assigned student: ${actualAssignedStudent}`,
    resSpoof.status === 201 && actualAssignedStudent === stud3Id,
    'Client-provided student ID in body was completely ignored'
  );

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log(`=== SUMMARY: ${passedCount}/${results.length} REGISTRATION TESTS PASSED ===`);
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runRegistrationTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
