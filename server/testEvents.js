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

async function runEventTests() {
  console.log('=== STARTING EVENT MANAGEMENT TESTS ===\n');
  const timestamp = Date.now();

  const results = [];
  const logResult = (testName, expected, actual, passed, details = '') => {
    results.push({ testName, expected, actual, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}`);
    console.log(`       Expected: ${expected}`);
    console.log(`       Actual:   ${actual}`);
    if (details) console.log(`       Details:  ${details}`);
    console.log('');
  };

  // Setup: Register 2 Organizers and 1 Student
  const org1Email = `org1_${timestamp}@campus.edu`;
  const org2Email = `org2_${timestamp}@campus.edu`;
  const studentEmail = `stud_${timestamp}@campus.edu`;

  const regOrg1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Organizer One', email: org1Email, password: 'password123', role: 'organizer' });
  const tokenOrg1 = regOrg1.data.token;
  const org1Id = regOrg1.data.user._id;

  const regOrg2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Organizer Two', email: org2Email, password: 'password123', role: 'organizer' });
  const tokenOrg2 = regOrg2.data.token;

  const regStud = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Student One', email: studentEmail, password: 'password123', role: 'student' });
  const tokenStud = regStud.data.token;

  // 1. Test GET /api/events without authentication
  const resGetEvents = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'GET'
  });
  logResult(
    '1. GET /api/events without authentication',
    'Status 200 with events array',
    `Status ${resGetEvents.status}`,
    resGetEvents.status === 200 && Array.isArray(resGetEvents.data.events)
  );

  // 2. Test Organizer 1 creating an event (valid)
  const validEventData = {
    title: 'Hackathon 2026',
    description: 'Annual campus coding competition',
    category: 'Technical',
    date: '2026-10-15T09:00:00.000Z',
    time: '09:00 AM',
    venue: 'Campus Tech Hall',
    capacity: 100,
    organizer: '507f1f77bcf86cd799439011' // Attempting to spoof organizer ID in body
  };
  const resCreateEvent = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, validEventData);
  const createdEvent = resCreateEvent.data.event;
  const isOrganizerCorrect = createdEvent && createdEvent.organizer === org1Id;
  logResult(
    '2. Organizer creating an event (POST /api/events)',
    `Status 201 and organizer assigned from token (${org1Id})`,
    `Status ${resCreateEvent.status}, Organizer: ${createdEvent ? createdEvent.organizer : 'none'}`,
    resCreateEvent.status === 201 && isOrganizerCorrect,
    'Client-supplied organizer in request body was safely ignored'
  );
  const event1Id = createdEvent ? createdEvent._id : null;

  // 3. Test GET /api/events/:id without authentication
  const resGetSingle = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${event1Id}`, method: 'GET'
  });
  logResult(
    '3. GET /api/events/:id without authentication',
    `Status 200 with event title '${validEventData.title}'`,
    `Status ${resGetSingle.status}, Title: ${resGetSingle.data.event ? resGetSingle.data.event.title : 'none'}`,
    resGetSingle.status === 200 && resGetSingle.data.event && resGetSingle.data.event.title === validEventData.title
  );

  // 4. Test student attempting to create an event
  const resStudentCreate = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStud}` }
  }, validEventData);
  logResult(
    '4. Student attempting to create an event',
    'Status 403 Forbidden',
    `Status ${resStudentCreate.status} (${resStudentCreate.data.message})`,
    resStudentCreate.status === 403
  );

  // 5. Test organizer updating their own event
  const resUpdateOwn = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${event1Id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { title: 'Hackathon 2026 - Extended', capacity: 150 });
  logResult(
    '5. Organizer updating their own event',
    'Status 200 with updated title and capacity',
    `Status ${resUpdateOwn.status}, Title: ${resUpdateOwn.data.event ? resUpdateOwn.data.event.title : 'none'}, Capacity: ${resUpdateOwn.data.event ? resUpdateOwn.data.event.capacity : 'none'}`,
    resUpdateOwn.status === 200 && resUpdateOwn.data.event.title === 'Hackathon 2026 - Extended' && resUpdateOwn.data.event.capacity === 150
  );

  // 6. Test organizer attempting to update another organizer's event
  const resUpdateOther = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${event1Id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg2}` }
  }, { title: 'Hijacked Event' });
  logResult(
    "6. Organizer attempting to update another organizer's event",
    'Status 403 Forbidden',
    `Status ${resUpdateOther.status} (${resUpdateOther.data.message})`,
    resUpdateOther.status === 403
  );

  // 7. Create a second event by Org 1 to test deletion
  const resCreateEvent2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { ...validEventData, title: 'Event To Delete' });
  const eventToDeleteId = resCreateEvent2.data.event._id;

  // 8. Test organizer attempting to delete another organizer's event
  const resDeleteOther = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${eventToDeleteId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenOrg2}` }
  });
  logResult(
    "8. Organizer attempting to delete another organizer's event",
    'Status 403 Forbidden',
    `Status ${resDeleteOther.status} (${resDeleteOther.data.message})`,
    resDeleteOther.status === 403
  );

  // 9. Test student attempting DELETE
  const resStudentDelete = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${eventToDeleteId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenStud}` }
  });
  logResult(
    '9. Student attempting DELETE',
    'Status 403 Forbidden',
    `Status ${resStudentDelete.status} (${resStudentDelete.data.message})`,
    resStudentDelete.status === 403
  );

  // 10. Test organizer deleting their own event
  const resDeleteOwn = await request({
    hostname: 'localhost', port: 5000, path: `/api/events/${eventToDeleteId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenOrg1}` }
  });
  logResult(
    '10. Organizer deleting their own event',
    'Status 200 OK',
    `Status ${resDeleteOwn.status} (${resDeleteOwn.data.message})`,
    resDeleteOwn.status === 200
  );

  // 11. Test GET /api/events/organizer/my-events (Strict Multi-Organizer Isolation)
  const regOrg2Id = regOrg2.data.user._id;
  await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg2}` }
  }, { ...validEventData, title: 'Org 2 Exclusive Event' });

  const resMyEventsOrg1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/events/organizer/my-events', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg1}` }
  });

  const resMyEventsOrg2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/events/organizer/my-events', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenOrg2}` }
  });

  const org1OnlyHasOrg1 = resMyEventsOrg1.data.events.every(e => String(e.organizer) === String(org1Id));
  const org2OnlyHasOrg2 = resMyEventsOrg2.data.events.every(e => String(e.organizer) === String(regOrg2Id));
  const org1HasNoOrg2Events = !resMyEventsOrg1.data.events.some(e => e.title === 'Org 2 Exclusive Event');

  logResult(
    '11. GET /api/events/organizer/my-events (Strict Multi-Organizer Isolation)',
    `Org 1 sees only Org 1 events, Org 2 sees only Org 2 events`,
    `Org 1 count: ${resMyEventsOrg1.data.count}, Org 2 count: ${resMyEventsOrg2.data.count}`,
    resMyEventsOrg1.status === 200 && resMyEventsOrg2.status === 200 && org1OnlyHasOrg1 && org2OnlyHasOrg2 && org1HasNoOrg2Events
  );

  // 12. Test invalid event ID format
  const resInvalidId = await request({
    hostname: 'localhost', port: 5000, path: '/api/events/not-a-valid-id', method: 'GET'
  });
  logResult(
    '12. Invalid event ID format (e.g. /api/events/not-a-valid-id)',
    'Status 400 Bad Request',
    `Status ${resInvalidId.status} (${resInvalidId.data.message})`,
    resInvalidId.status === 400
  );

  // 13. Test invalid category
  const resInvalidCategory = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { ...validEventData, category: 'Gaming' });
  logResult(
    '13. Invalid category (e.g. "Gaming")',
    'Status 400 Bad Request',
    `Status ${resInvalidCategory.status} (${resInvalidCategory.data.message})`,
    resInvalidCategory.status === 400
  );

  // 14. Test capacity = 0 or negative capacity
  const resZeroCapacity = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { ...validEventData, capacity: 0 });
  const resNegCapacity = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { ...validEventData, capacity: -10 });
  logResult(
    '14. Capacity = 0 or negative capacity (0 and -10)',
    'Status 400 Bad Request for both',
    `Capacity 0 -> ${resZeroCapacity.status}, Capacity -10 -> ${resNegCapacity.status}`,
    resZeroCapacity.status === 400 && resNegCapacity.status === 400
  );

  // 15. Test missing required fields
  const resMissingFields = await request({
    hostname: 'localhost', port: 5000, path: '/api/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenOrg1}` }
  }, { title: 'Incomplete Event' });
  logResult(
    '15. Missing required fields',
    'Status 400 Bad Request',
    `Status ${resMissingFields.status} (${resMissingFields.data.message})`,
    resMissingFields.status === 400
  );

  // Final summary
  const passedCount = results.filter(r => r.passed).length;
  console.log(`=== SUMMARY: ${passedCount}/${results.length} EVENT TESTS PASSED ===`);
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runEventTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
