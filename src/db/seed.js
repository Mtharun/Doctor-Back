// Seeds a fresh database with an admin account, dentists, and services so
// the app is usable immediately after `npm run seed`. Safe to re-run:
// it skips anything that already exists instead of duplicating rows.
import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "./index.js";
import { UserModel } from "../models/user.model.js";
import { DentistModel } from "../models/dentist.model.js";
import { ServiceModel } from "../models/service.model.js";

async function upsertAdmin() {
  const email = "admin@dentalcare.com";
  const existing = UserModel.findByEmail(email);
  if (existing) return existing;

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  return UserModel.create({
    name: "Dr. Sarah Johnson",
    email,
    passwordHash,
    role: "admin",
    phone: "+15551234567",
  });
}

function seedDentists() {
  const dentists = [
    { name: "Dr. Sarah Johnson", specialty: "General Dentistry", bio: "15+ years of experience in general and preventive dentistry.", startTime: "09:00", endTime: "17:00", slotMinutes: 30 },
    { name: "Dr. Michael Chen", specialty: "Orthodontics", bio: "Specialist in braces, aligners and bite correction.", startTime: "09:00", endTime: "16:00", slotMinutes: 45 },
    { name: "Dr. Emily Williams", specialty: "Cosmetic Dentistry", bio: "Focused on whitening, veneers and smile makeovers.", startTime: "10:00", endTime: "18:00", slotMinutes: 30 },
    { name: "Dr. James Brown", specialty: "Oral Surgery", bio: "Handles extractions, implants and oral surgery.", startTime: "08:00", endTime: "15:00", slotMinutes: 60 },
  ];

  const existingNames = new Set(DentistModel.list().map((d) => d.name));
  for (const d of dentists) {
    if (existingNames.has(d.name)) continue;
    DentistModel.create({ ...d, workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] });
  }
}

function seedServices() {
  const services = [
    { name: "Regular Checkup", description: "Routine dental examination and oral health check.", durationMinutes: 30, price: 50 },
    { name: "Teeth Cleaning", description: "Professional cleaning and plaque removal.", durationMinutes: 45, price: 80 },
    { name: "Teeth Whitening", description: "Cosmetic whitening treatment for a brighter smile.", durationMinutes: 60, price: 200 },
    { name: "Root Canal Treatment", description: "Treatment to save an infected or damaged tooth.", durationMinutes: 90, price: 450 },
    { name: "Tooth Extraction", description: "Safe removal of a damaged or problem tooth.", durationMinutes: 45, price: 120 },
    { name: "Dental Implants", description: "Permanent replacement for missing teeth.", durationMinutes: 120, price: 1500 },
    { name: "Braces Consultation", description: "Assessment and planning for orthodontic treatment.", durationMinutes: 30, price: 60 },
    { name: "Emergency Consultation", description: "Urgent evaluation for dental pain or trauma.", durationMinutes: 30, price: 90 },
  ];

  const existingNames = new Set(ServiceModel.list().map((s) => s.name));
  for (const s of services) {
    if (existingNames.has(s.name)) continue;
    ServiceModel.create(s);
  }
}

async function main() {
  const admin = await upsertAdmin();
  seedDentists();
  seedServices();
  console.log("Seed complete.");
  console.log(`Admin login -> email: ${admin.email}  password: Admin@123`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
