const assert = require('node:assert/strict');
const { deliverNotification } = require('../src/services/notificationService');

const createDatabase = ({ preferences = null, duplicate = false } = {}) => {
  const rows = [];
  const notificationModel = {
    async create(values) {
      const row = {
        ...values,
        id: rows.length + 1,
        created_at: new Date('2026-09-05T10:00:00.000Z'),
        async update(updates) {
          Object.assign(this, updates);
        },
      };
      rows.push(row);
      return row;
    },
    async findOrCreate({ defaults }) {
      if (duplicate) {
        return [{ id: 99, ...defaults }, false];
      }
      return [await this.create(defaults), true];
    },
    async count() {
      return rows.filter((row) => !row.is_read).length;
    },
  };

  return {
    rows,
    Notification: notificationModel,
    DeviceToken: { async findAll() { return []; } },
    NotificationPreference: { async findOne() { return preferences; } },
  };
};

const run = async () => {
  const emissions = [];
  global.io = {
    to(room) {
      return {
        emit(event, payload) {
          emissions.push({ room, event, payload });
        },
      };
    },
  };

  const enabledDb = createDatabase();
  const delivered = await deliverNotification({
    db: enabledDb,
    recipientId: 7,
    recipientType: 'veterinarian',
    title: 'New appointment',
    body: 'A farmer requested an appointment.',
    type: 'new_appointment',
    data: { appointmentId: 'appointment-1' },
  });

  assert.equal(delivered.delivered, true);
  assert.equal(enabledDb.rows.length, 1);
  assert.equal(enabledDb.rows[0].data.appointment_id, 'appointment-1');
  assert.equal(enabledDb.rows[0].data.notification_id, enabledDb.rows[0].id);
  assert.equal(emissions[0].room, 'recipient:veterinarian:7');
  assert.equal(emissions[0].payload.id, enabledDb.rows[0].id);

  const disabledDb = createDatabase({ preferences: { appointments_enabled: false } });
  const suppressed = await deliverNotification({
    db: disabledDb,
    recipientId: 10,
    title: 'Appointment update',
    body: 'Changed',
    type: 'appointment_confirmed',
  });
  assert.equal(suppressed.suppressed, true);
  assert.equal(disabledDb.rows.length, 0);

  const duplicateDb = createDatabase({ duplicate: true });
  const deduplicated = await deliverNotification({
    db: duplicateDb,
    recipientId: 12,
    title: 'Reminder',
    body: 'Tomorrow',
    type: 'appointment_reminder',
    data: { dedupe_key: 'appointment-reminder:1:2026-09-06' },
  });
  assert.equal(deduplicated.duplicate, true);
  assert.equal(duplicateDb.rows.length, 0);

  delete global.io;
  console.log('Notification delivery tests passed');
};

run().catch((error) => {
  delete global.io;
  console.error(error);
  process.exitCode = 1;
});
