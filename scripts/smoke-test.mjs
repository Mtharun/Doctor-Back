// One-shot end-to-end smoke test: boots the Express app in-process, hits
// every route with fetch, and prints PASS/FAIL lines. Not a permanent
// part of the app - just used to verify the API while building it.
import "dotenv/config";
import app from "../src/app.js";

const PORT = 5099;
const BASE = `http://localhost:${PORT}`;
let pass = 0;
let fail = 0;

function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

async function json(method, url, body, token, isForm = false) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

const server = app.listen(PORT, async () => {
  try {
    // Health
    let r = await json("GET", "/api/health");
    check("health check", r.status === 200 && r.data.status === "ok");

    // Admin login
    r = await json("POST", "/api/auth/login", { email: "admin@dentalcare.com", password: "Admin@123" });
    check("admin login", r.status === 200 && r.data.token, JSON.stringify(r.data));
    const adminToken = r.data.token;

    // Wrong password
    r = await json("POST", "/api/auth/login", { email: "admin@dentalcare.com", password: "wrong" });
    check("login rejects wrong password", r.status === 401);

    // Patient signup
    const email = `patient${Date.now()}@test.com`;
    r = await json("POST", "/api/auth/register", { name: "Test Patient", email, password: "secret6", phone: "9876543210", age: 30 });
    check("patient register", r.status === 201 && r.data.token, JSON.stringify(r.data));
    const patientToken = r.data.token;
    const patientId = r.data.user.id;

    // Duplicate email
    r = await json("POST", "/api/auth/register", { name: "Dup", email, password: "secret6", phone: "9876543210" });
    check("register rejects duplicate email", r.status === 409);

    // Weak password validation
    r = await json("POST", "/api/auth/register", { name: "Weak", email: `w${Date.now()}@test.com`, password: "123", phone: "9876543210" });
    check("register rejects short password", r.status === 422);

    // No token -> protected route
    r = await json("GET", "/api/appointments");
    check("appointments requires auth", r.status === 401);

    // me
    r = await json("GET", "/api/auth/me", null, patientToken);
    check("get own profile", r.status === 200 && r.data.user.email === email);

    // update profile
    r = await json("PUT", "/api/auth/me", { phone: "1112223333" }, patientToken);
    check("update profile", r.status === 200 && r.data.user.phone === "1112223333");

    // services / dentists
    r = await json("GET", "/api/services");
    check("list services", r.status === 200 && r.data.services.length > 0);
    const serviceId = r.data.services[0].id;

    r = await json("GET", "/api/dentists");
    check("list dentists", r.status === 200 && r.data.dentists.length > 0);
    const dentist = r.data.dentists[0];

    // patient cannot create a service (admin-only)
    r = await json("POST", "/api/services", { name: "Hack" }, patientToken);
    check("patient blocked from admin-only route (403)", r.status === 403);

    // availability - find a working weekday
    const d = new Date();
    let dateStr = "";
    for (let i = 1; i <= 10; i++) {
      const candidate = new Date(d.getTime() + i * 86400000);
      const day = candidate.toLocaleDateString("en-US", { weekday: "short" });
      if (dentist.workingDays.includes(day)) {
        dateStr = candidate.toISOString().slice(0, 10);
        break;
      }
    }
    r = await json("GET", `/api/dentists/${dentist.id}/availability?date=${dateStr}`);
    check("get availability", r.status === 200 && Array.isArray(r.data.slots) && r.data.slots.length > 0, JSON.stringify(r.data).slice(0,200));
    const freeSlot = r.data.slots.find((s) => s.available);
    check("availability has a free slot", !!freeSlot);
    const time = freeSlot.time;

    // book in the past -> rejected
    r = await json("POST", "/api/appointments", { dentistId: dentist.id, serviceId, date: "2020-01-01", time: "10:00", reason: "test" }, patientToken);
    check("booking in the past rejected", r.status === 400);

    // create appointment
    r = await json("POST", "/api/appointments", { dentistId: dentist.id, serviceId, date: dateStr, time, reason: "Tooth pain" }, patientToken);
    check("create appointment", r.status === 201 && r.data.appointment.status === "pending", JSON.stringify(r.data));
    const appointmentId = r.data.appointment.id;

    // double-book same slot -> 409
    r = await json("POST", "/api/appointments", { dentistId: dentist.id, serviceId, date: dateStr, time, reason: "Dup" }, patientToken);
    check("double-booking rejected (409)", r.status === 409);

    // patient cannot confirm own appointment
    r = await json("PUT", `/api/appointments/${appointmentId}/status`, { status: "confirmed" }, patientToken);
    check("patient cannot self-confirm appointment", r.status === 400);

    // admin confirms
    r = await json("PUT", `/api/appointments/${appointmentId}/status`, { status: "confirmed" }, adminToken);
    check("admin confirms appointment", r.status === 200 && r.data.appointment.status === "confirmed");

    // list appointments (admin sees it, patient sees own)
    r = await json("GET", "/api/appointments", null, patientToken);
    check("patient sees own appointment", r.status === 200 && r.data.appointments.some((a) => a.id === appointmentId));

    // stats (admin only)
    r = await json("GET", "/api/appointments/stats", null, adminToken);
    check("admin appointment stats", r.status === 200 && typeof r.data.stats.pending === "number");
    r = await json("GET", "/api/appointments/stats", null, patientToken);
    check("patient blocked from stats (403)", r.status === 403);

    // patient cannot view another patient's appointment
    r = await json("POST", "/api/auth/register", { name: "Other Patient", email: `other${Date.now()}@test.com`, password: "secret6", phone: "9876543211" });
    const otherToken = r.data.token;
    r = await json("GET", `/api/appointments/${appointmentId}`, null, otherToken);
    check("other patient blocked from viewing appointment (403)", r.status === 403);

    // admin patient list & detail
    r = await json("GET", "/api/patients", null, adminToken);
    check("admin lists patients", r.status === 200 && r.data.patients.length >= 2);
    r = await json("GET", `/api/patients/${patientId}`, null, adminToken);
    check("admin views patient detail", r.status === 200 && r.data.patient.id === patientId);
    r = await json("GET", "/api/patients", null, patientToken);
    check("patient blocked from patient list (403)", r.status === 403);

    // emergency request
    r = await json("POST", "/api/emergency", { name: "Test Patient", phone: "9876543210", location: "123 Main St", description: "Severe tooth pain", priority: "high" }, patientToken);
    check("create emergency request", r.status === 201 && r.data.request.status === "pending", JSON.stringify(r.data));
    const emergencyId = r.data.request.id;

    r = await json("PUT", `/api/emergency/${emergencyId}/status`, { status: "accepted" }, adminToken);
    check("admin accepts emergency request", r.status === 200 && r.data.request.status === "accepted");

    r = await json("PUT", `/api/emergency/${emergencyId}/status`, { status: "accepted" }, patientToken);
    check("patient cannot set arbitrary emergency status (403)", r.status === 403);

    // notifications
    r = await json("GET", "/api/notifications", null, patientToken);
    check("patient has notifications from booking/emergency", r.status === 200 && r.data.notifications.length > 0);

    // reschedule
    let dateStr2 = "";
    for (let i = 2; i <= 12; i++) {
      const candidate = new Date(d.getTime() + i * 86400000);
      const day = candidate.toLocaleDateString("en-US", { weekday: "short" });
      if (dentist.workingDays.includes(day)) {
        dateStr2 = candidate.toISOString().slice(0, 10);
        break;
      }
    }
    r = await json("PUT", `/api/appointments/${appointmentId}/reschedule`, { date: dateStr2, time }, patientToken);
    check("reschedule appointment", r.status === 200 && r.data.appointment.date === dateStr2 && r.data.appointment.status === "pending", JSON.stringify(r.data));

    // cancel
    r = await json("PUT", `/api/appointments/${appointmentId}/status`, { status: "cancelled" }, patientToken);
    check("patient cancels appointment", r.status === 200 && r.data.appointment.status === "cancelled");

    // 404 route
    r = await json("GET", "/api/does-not-exist");
    check("unknown route -> 404", r.status === 404);

  } catch (e) {
    console.error("SMOKE TEST CRASHED:", e);
    fail++;
  } finally {
    console.log(`\n${pass} passed, ${fail} failed`);
    server.close(() => process.exit(fail > 0 ? 1 : 0));
  }
});
