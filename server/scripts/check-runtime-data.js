'use strict';
// Read-only deployment preflight. Run against the intended database before migrating.
require('dotenv').config();
const db = require('../src/models');
const checks = [
  ['appointments', "SELECT veterinarian_id, appointment_date, appointment_time, array_agg(id) AS ids FROM appointments WHERE status IN ('pending','confirmed') GROUP BY 1,2,3 HAVING count(*) > 1"],
  ['individual_milk_reports', "SELECT user_id, report_date, cow_id, array_agg(id) AS ids FROM milk_reports WHERE report_type='individual' AND cow_id IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1"],
  ['overall_milk_reports', "SELECT user_id, report_date, array_agg(id) AS ids FROM milk_reports WHERE report_type='overall' GROUP BY 1,2 HAVING count(*) > 1"],
  ['tagged_animals', 'SELECT user_id, animal_type, cow_tag, array_agg(id) AS ids FROM farmer_cows WHERE cow_tag IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1'],
  ['untagged_animals', 'SELECT user_id, animal_type, cow_name, array_agg(id) AS ids FROM farmer_cows WHERE cow_tag IS NULL GROUP BY 1,2,3 HAVING count(*) > 1'],
];
async function run() {
  const duplicates = {};
  try {
    for (const [name, query] of checks) duplicates[name] = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
    const [documents] = await db.sequelize.query(`SELECT id FROM veterinarians WHERE
      (license_document IS NOT NULL AND license_document NOT LIKE 'private:%') OR
      (degree_certificate IS NOT NULL AND degree_certificate NOT LIKE 'private:%') OR
      (aadhar_document IS NOT NULL AND aadhar_document NOT LIKE 'private:%')`);
    const ready = Object.values(duplicates).every(rows => rows.length === 0);
    console.log(JSON.stringify({ readyForIntegrityMigration: ready, duplicates, legacyPublicDocumentVeterinarianIds: documents.map(row => row.id) }, null, 2));
    if (!ready || documents.length) process.exitCode = 1;
  } finally { await db.sequelize.close(); }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
