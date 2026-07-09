// Run with:  node scripts/fix-appointments.cjs
// Uses the project's mongoose. Non-destructive + idempotent (only $sets fixes).

const mongoose = require("mongoose");

const URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/doctor-appointment";

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
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value);
  return null;
}

function toLocalISODate(value) {
  if (value == null) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return new Date(value.trim() + "T00:00:00"); // local midnight
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

async function fixCollection(name, refFields, fixAppointmentFields) {
  const coll = mongoose.connection.collection(name);
  const total = await coll.countDocuments();
  let fixed = 0;
  const docs = await coll.find({}).toArray();
  for (const doc of docs) {
    const set = {};
    for (const f of refFields) {
      if (doc[f] != null) {
        const oid = toObjectId(doc[f]);
        if (oid && oid.toString() !== String(doc[f])) set[f] = oid;
      }
    }
    if (doc.date != null && typeof doc.date === "string") {
      set.date = toLocalISODate(doc.date);
    }
    if (fixAppointmentFields) {
      if (!doc.status || !VALID_STATUS.includes(doc.status)) set.status = "Pending";
      if (!doc.paymentStatus || !VALID_PAYMENT.includes(doc.paymentStatus))
        set.paymentStatus = "Pending";
    }
    if (Object.keys(set).length > 0) {
      await coll.updateOne({ _id: doc._id }, { $set: set });
      fixed += 1;
    }
  }
  console.log(`${name}: ${total} docs, ${fixed} fixed`);
}

async function main() {
  await mongoose.connect(URI);
  console.log("Connected to", URI);

  await fixCollection("appointments", ["patientId", "doctorId", "createdBy", "slotId"], true);
  await fixCollection("prescriptions", ["appointmentId", "patientId", "doctorId"], false);
  await fixCollection("bills", ["appointmentId", "patientId"], false);

  // Backfill privacy-friendly customId for any users that don't have one yet.
  const userColl = mongoose.connection.collection("users");
  const usersNoId = await userColl.find({ customId: { $in: [null, ""] } }).toArray();
  const prefixes = { Patient: "PT", Doctor: "DR", Receptionist: "RC", Admin: "AD", SuperAdmin: "SA" };
  let userFixed = 0;
  for (const u of usersNoId) {
    const prefix = prefixes[u.role] || "US";
    const suffix = (Date.now().toString(36).slice(-3) + Math.random().toString(36).slice(2, 6))
      .toUpperCase()
      .padStart(6, "0");
    await userColl.updateOne({ _id: u._id }, { $set: { customId: `${prefix}-${suffix}` } });
    userFixed += 1;
  }
  console.log(`users: ${userFixed} backfilled with customId`);

  const appt = mongoose.connection.collection("appointments");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const inQueue = await appt.countDocuments({
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ["Confirmed", "CheckedIn", "InProgress", "Pending"] },
  });
  const totalAppts = await appt.countDocuments();
  console.log(`\nQueue-eligible (today + allowed status): ${inQueue} of ${totalAppts} appointments`);

  const sample = await appt.findOne({});
  if (sample) {
    console.log("Sample appointment types:");
    console.log("  date:      ", (sample.date && sample.date.constructor && sample.date.constructor.name) || typeof sample.date, String(sample.date));
    console.log("  patientId: ", (sample.patientId && sample.patientId.constructor && sample.patientId.constructor.name) || typeof sample.patientId, String(sample.patientId));
    console.log("  doctorId:  ", (sample.doctorId && sample.doctorId.constructor && sample.doctorId.constructor.name) || typeof sample.doctorId, String(sample.doctorId));
    console.log("  status:    ", sample.status);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
