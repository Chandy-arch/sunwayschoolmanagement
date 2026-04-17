/**
 * Seed script — creates 5 students per class with mocked realistic data.
 * Run: npm run seed
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Manually parse .env.local (dotenv not installed)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/praba-school";

// ─── Schema (inline to avoid Next.js module issues in tsx context) ────────────
const StudentSchema = new mongoose.Schema(
  {
    studentId:       { type: String, required: true, unique: true },
    name:            { type: String, required: true },
    email:           { type: String, lowercase: true },
    phone:           { type: String },
    dateOfBirth:     { type: Date, required: true },
    gender:          { type: String, enum: ["Male", "Female", "Other"], required: true },
    bloodGroup:      { type: String },
    address:         { type: String },
    className:       { type: String, required: true },
    section:         { type: String, required: true },
    rollNumber:      { type: Number },
    parentName:      { type: String },
    parentPhone:     { type: String },
    parentEmail:     { type: String },
    admissionDate:   { type: Date, default: Date.now },
    admissionNumber: { type: String, unique: true, sparse: true },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Student =
  mongoose.models?.Student || mongoose.model("Student", StudentSchema);

// ─── Constants ────────────────────────────────────────────────────────────────
const SCHOOL_GRADES = [
  "Pre KG", "LKG", "UKG",
  "Grade 1A", "Grade 1B",
  "Grade 2A",
  "Grade 3A", "Grade 3B",
  "Grade 4", "Grade 5", "Grade 6",
] as const;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS: ("Male" | "Female")[] = ["Male", "Female"];
const ADDRESSES = [
  "12 Anna Nagar, Chennai",
  "34 Velachery Main Rd, Chennai",
  "56 OMR, Sholinganallur, Chennai",
  "78 Adyar, Chennai",
  "90 T.Nagar, Chennai",
];

function getSectionFromGrade(grade: string): string {
  const match = grade.match(/([AB])$/);
  return match ? match[1] : "A";
}

/** Slug usable in IDs/emails: "Pre KG" → "PreKG", "Grade 1A" → "Grade1A" */
function gradeSlug(grade: string): string {
  return grade.replace(/\s+/g, "");
}

/** Random date of birth between age 3 and 16 */
function randomDOB(index: number): Date {
  const ageYears = 3 + (index % 14);
  const base = new Date("2026-04-15");
  base.setFullYear(base.getFullYear() - ageYears);
  base.setMonth(index % 12);
  base.setDate((index % 28) + 1);
  return base;
}

// ─── Build student records ────────────────────────────────────────────────────
const students: object[] = [];
let globalSeq = 1;

for (const grade of SCHOOL_GRADES) {
  const section = getSectionFromGrade(grade);
  const slug = gradeSlug(grade);

  for (let i = 1; i <= 5; i++) {
    const seq = String(globalSeq).padStart(4, "0");
    const studentId = `STU${seq}`;
    const admissionNumber = `ADM2026${seq}`;
    const name = `Student${i} ${grade}`;           // e.g. "Student1 Grade 1A"
    const emailSlug = `student${i}.${slug.toLowerCase()}`; // e.g. "student1.grade1a"
    const email = `${emailSlug}@sunwayschool.edu`;
    const phone = `98765${String(globalSeq).padStart(5, "0")}`.slice(0, 10);
    const parentName = `Parent${i} ${grade}`;
    const parentEmail = `parent${i}.${slug.toLowerCase()}@gmail.com`;
    const parentPhone = `98760${String(globalSeq).padStart(5, "0")}`.slice(0, 10);

    students.push({
      studentId,
      admissionNumber,
      name,
      email,
      phone,
      dateOfBirth: randomDOB(globalSeq),
      gender: GENDERS[globalSeq % 2],
      bloodGroup: BLOOD_GROUPS[globalSeq % BLOOD_GROUPS.length],
      address: ADDRESSES[globalSeq % ADDRESSES.length],
      className: grade,
      section,
      rollNumber: i,
      parentName,
      parentPhone,
      parentEmail,
      admissionDate: new Date("2026-04-01"),
      isActive: true,
    });

    globalSeq++;
  }
}

// ─── Insert ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Connecting to ${MONGODB_URI} …`);
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("Connected.");

  // Remove existing seeded students to allow re-runs
  const deleted = await Student.deleteMany({
    studentId: { $regex: /^STU\d{4}$/ },
  });
  if (deleted.deletedCount > 0) {
    console.log(`Removed ${deleted.deletedCount} previously seeded student(s).`);
  }

  const result = await Student.insertMany(students, { ordered: false });
  console.log(`\n✓ Inserted ${result.length} students across ${SCHOOL_GRADES.length} classes (5 per class).\n`);

  // Summary table
  for (const grade of SCHOOL_GRADES) {
    const count = await Student.countDocuments({ className: grade });
    console.log(`  ${grade.padEnd(12)} → ${count} students`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
