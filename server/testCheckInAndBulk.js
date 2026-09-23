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

async function runCheckInAndBulkTests() {
  console.log('=== STARTING CHECK-IN & BULK EVENT TESTS ===\n');
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

  // 1. Setup Organizer & Students
  const orgEmail = `chk_org_${timestamp}@campus.edu`;
  const stud1Email = `chk_stud1_${timestamp}@campus.edu`;
  const stud2Email = `chk_stud2_${timestamp}@campus.edu`;

  const regOrg = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Checkin Org', email: orgEmail, password: 'password123', role: 'organizer' });
  const tokenOrg = regOrg.data.token;

  const regStud1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Attendee One', email: stud1Email, password: 'password123', role: 'student', department: 'CS' });
  const tokenStud1 = regStud1.data.token;

  const regStud2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Attendee Two', email: stud2Email, password: 'password123', role: 'student', department: 'EE' });
  const tokenStud2 = regStud2.data.token;

  // 2. Create Event with Capacity = 5
  const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const createEvt = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg}` }
  }, {
    title: 'Tech Summit 2026',
    description: 'Annual Innovation Summit',
    category: 'Technical',
    date: futureDate,
    time: '10:00 AM',
    venue: 'Grand Hall',
    capacity: 5
  });
  const eventId = createEvt.data.event._id;

  // Test 1: Student registers and gets a unique Ticket ID
  const regRes1 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${eventId}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud1}` }
  });
  const ticket1 = regRes1.data.registration ? regRes1.data.registration.ticketId : null;
  const hasTicketId = !!ticket1 && ticket1.startsWith('TKT-');
  logResult(
    1, 'Registration issues a unique Ticket ID string (TKT-...)',
    'Status 201 with ticketId starting with TKT-',
    `Status ${regRes1.status}, Ticket ID: ${ticket1}`,
    regRes1.status === 201 && hasTicketId
  );

  // Test 2: Second student registers
  const regRes2 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/${eventId}`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenStud2}` }
  });
  const ticket2 = regRes2.data.registration ? regRes2.data.registration.ticketId : null;

  // Test 3: Live Dashboard stats before check-in
  const statsRes1 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/event/${eventId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg}` }
  });
  const stats1 = statsRes1.data.stats;
  logResult(
    3, 'Live Dashboard Stats before check-in',
    'Registered: 2, Checked-In: 0, Capacity: 5',
    `Registered: ${stats1 ? stats1.registeredCount : null}, Checked-In: ${stats1 ? stats1.checkedInCount : null}, Capacity: ${stats1 ? stats1.capacity : null}`,
    statsRes1.status === 200 && stats1 && stats1.registeredCount === 2 && stats1.checkedInCount === 0
  );

  // Test 4: First check-in succeeds
  const chkRes1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/check-in', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg}` }
  }, { ticketId: ticket1, eventId });
  logResult(
    4, 'Valid ticket check-in at physical venue',
    'Status 200 with check-in confirmation',
    `Status ${chkRes1.status} (${chkRes1.data.message})`,
    chkRes1.status === 200 && chkRes1.data.registration.checkedIn === true
  );

  // Test 5: STRICT DUPLICATE CHECK-IN REJECTION
  const chkResDup = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/check-in', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg}` }
  }, { ticketId: ticket1, eventId });
  logResult(
    5, 'DUPLICATE CHECK-IN PREVENTED (Ticket checked in second time rejected)',
    'Status 400 with duplicate=true and rejection message',
    `Status ${chkResDup.status} (${chkResDup.data.message})`,
    chkResDup.status === 400 && chkResDup.data.duplicate === true
  );

  // Test 6: Live Dashboard stats after 1 check-in
  const statsRes2 = await request({
    hostname: 'localhost', port: 5000, path: `/api/registrations/event/${eventId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg}` }
  });
  const stats2 = statsRes2.data.stats;
  logResult(
    6, 'Live Dashboard Stats updated (1 checked in, 50% rate)',
    'Registered: 2, Checked-In: 1, Percentage: 50%',
    `Registered: ${stats2 ? stats2.registeredCount : null}, Checked-In: ${stats2 ? stats2.checkedInCount : null}, Rate: ${stats2 ? stats2.checkInPercentage : null}%`,
    statsRes2.status === 200 && stats2 && stats2.checkedInCount === 1 && stats2.checkInPercentage === 50
  );

  // Test 7: Invalid ticket ID check-in rejected
  const chkResInvalid = await request({
    hostname: 'localhost', port: 5000, path: '/api/registrations/check-in', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg}` }
  }, { ticketId: 'TKT-INVALID-9999' });
  logResult(
    7, 'Invalid / Non-existent Ticket ID check-in rejected',
    'Status 404 Ticket not found',
    `Status ${chkResInvalid.status} (${chkResInvalid.data.message})`,
    chkResInvalid.status === 404
  );

  // Test 8: Bulk Event Creation
  const bulkRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/events/bulk', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg}` }
  }, {
    events: [
      { title: 'Bulk Event A', description: 'Desc A', category: 'Technical', date: futureDate, time: '10:00 AM', venue: 'Hall A', capacity: 30 },
      { title: 'Bulk Event B', description: 'Desc B', category: 'Cultural', date: futureDate, time: '02:00 PM', venue: 'Auditorium', capacity: 100 },
      { title: 'Bulk Event C', description: 'Desc C', category: 'Workshop', date: futureDate, time: '04:00 PM', venue: 'Lab 2', capacity: 15 }
    ]
  });
  logResult(
    8, 'Bulk Event Creation (POST /api/events/bulk)',
    'Status 201 with createdCount = 3',
    `Status ${bulkRes.status}, Created: ${bulkRes.data.createdCount}`,
    bulkRes.status === 201 && bulkRes.data.createdCount === 3
  );

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log(`=== SUMMARY: ${passedCount}/${results.length} CHECK-IN & BULK TESTS PASSED ===`);
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runCheckInAndBulkTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
