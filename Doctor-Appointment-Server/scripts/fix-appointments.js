// Run with:  mongosh "mongodb://localhost:27017/doctor-appointment" scripts/fix-appointments.js
//
// Fixes appointment documents that were inserted directly into MongoDB (e.g. via
// Compass / mongosh) instead of through the app, which is why they don't show up
// in the receptionist queue, patient "My Appointments", doctor appointments, etc.
//
// What it repairs:
//   1. Ref fields (patientId, doctorId, createdBy, slotId) stored as plain strings
//      -> converted to real ObjectIds so equality matches + populate() works.
//   2. date stored as a string -> converted to a real ISODate (range queries need it).
//   3. status missing/invalid -> defaulted to "Pending" (receptionist queue only shows
//      Confirmed/CheckedIn/InProgress/Pending).
//   4. paymentStatus missing -> defaulted to "Pending".
//
// It also repairs the same ref/date issues on prescriptions and bills.
// Safe to run multiple times (idempotent). Prints a summary at the end.

const VALID_STATUS = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "InProgress",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "NoShow",
];

const VALID_PAYMENT = ["Pending", "Paid", "Refunded"];

function toObjectId(value) {
  if (value == null) return null;
  if (typeof value === "object" && value._bsontype === "ObjectId") return value;
  if (typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value)) {
    return ObjectId(value);
  }
  return null;
}

function toISODate(value) {
  if (value == null) return new Date();
  if (typeof value === "object" && value instanceof Date) return value;
  if (typeof value === "string") {
    // "YYYY-MM-DD" -> LOCAL midnight, to match how the app now stores dates
    // (otherwise UTC midnight shifts "today" into yesterday in IST and the
    // receptionist queue hides it).
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return new Date(value.trim() + "T00:00:00");
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function fixCollection(name, refFields) {
  const coll = db.getCollection(name);
  const total = coll.countDocuments();
  let fixed = 0;
  coll.find().forEach((doc) => {
    const set = {};
    for (const f of refFields) {
      if (doc[f] != null) {
        const oid = toObjectId(doc[f]);
        if (oid && oid.toString() !== String(doc[f])) {
          set[f] = oid;
        }
      }
    }
    if (doc.date != null) {
      const d = toISODate(doc.date);
      // Only rewrite if stored as a string (Date objects stay as-is).
      if (typeof doc.date === "string") set.date = d;
    }
    if (name === "appointments") {
      if (!doc.status || !VALID_STATUS.includes(doc.status)) set.status = "Pending";
      if (!doc.paymentStatus || !VALID_PAYMENT.includes(doc.paymentStatus))
        set.paymentStatus = "Pending";
    }
    if (Object.keys(set).length > 0) {
      coll.updateOne({ _id: doc._id }, { $set: set });
      fixed += 1;
    }
  });
  print(`${name}: ${total} docs, ${fixed} fixed`);
}

print("=== MediBook appointment data repair ===");
fixCollection("appointments", ["patientId", "doctorId", "createdBy", "slotId"]);
fixCollection("prescriptions", ["appointmentId", "patientId", "doctorId"]);
fixCollection("bills", ["appointmentId", "patientId"]);
print("=== Done ===");
