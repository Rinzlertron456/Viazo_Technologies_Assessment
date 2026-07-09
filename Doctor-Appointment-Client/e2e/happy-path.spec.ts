import { test, expect } from "@playwright/test";

function uniq(prefix: string) {
  return `${prefix}+${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;
}

const ADMIN = {
  firstName: "Anil",
  lastName: "Kumar",
  email: uniq("anil.admin"),
  phone: "+919876543210",
  password: "Test@123",
};

const DOCTOR = {
  firstName: "Suresh",
  lastName: "Rao",
  email: uniq("dr.suresh"),
  phone: "+919812345678",
  password: "Doctor@123",
  specialization: "Cardiologist",
  experience: "12",
  qualification: "MD, DM Cardiology",
  fee: "500",
  city: "Hyderabad",
};

const PATIENT = {
  firstName: "Priya",
  lastName: "Singh",
  email: uniq("priya.patient"),
  phone: "+919800112233",
  password: "Patient@123",
};

async function register(page: any, user: any, role: string) {
  await page.goto("/register");
  await page.fill("#firstName", user.firstName);
  await page.fill("#lastName", user.lastName);
  await page.fill("#email", user.email);
  await page.fill("#phone", user.phone);
  await page.fill("#password", user.password);
  await page.selectOption("#role", role);
  await page.getByRole("button", { name: "Create Account" }).click();
}

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

async function logout(page: any) {
  await page.getByRole("button", { name: /logout/i }).click();
}

test.describe("MediBook happy path", () => {
  test("TC-AUTH-01 / TC-ADM-01 / TC-DOC-01 / TC-PAT-01 — full booking flow", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // TC-AUTH-01: register Admin and auto-login
    await register(page, ADMIN, "Admin");
    await expect(page).toHaveURL(/\/dashboard/);

    // TC-ADM-01: add a doctor
    await page.goto("/admin/doctors");
    await page.getByRole("button", { name: "Add Doctor" }).click();
    await page.fill("#firstName", DOCTOR.firstName);
    await page.fill("#lastName", DOCTOR.lastName);
    await page.fill("#email", DOCTOR.email);
    await page.fill("#password", DOCTOR.password);
    await page.fill("#specialization", DOCTOR.specialization);
    await page.fill("#phone", DOCTOR.phone);
    await page.fill("#experience", DOCTOR.experience);
    await page.fill("#qualification", DOCTOR.qualification);
    await page.fill("#consultationFee", DOCTOR.fee);
    await page.fill("#clinicCity", DOCTOR.city);
    await page.getByRole("button", { name: "Add Doctor" }).click();
    // success collapses the form; verify the new doctor appears in the list
    await expect(page.getByText(DOCTOR.email)).toBeVisible();

    // TC-AUTH-02: login as the doctor
    await logout(page);
    await login(page, DOCTOR.email, DOCTOR.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // TC-DOC-01: doctor adds a slot
    await page.goto("/doctor/schedule");
    await page.fill("#date", "2026-07-10");
    await page.fill("#startTime", "10:00");
    await page.fill("#endTime", "11:00");
    await page.fill("#maxPatients", "3");
    await page.getByRole("button", { name: /add slot/i }).click();
    await expect(page.getByText("Slot created!")).toBeVisible();

    // TC-PAT-01: register + login as patient
    await logout(page);
    await register(page, PATIENT, "Patient");
    await expect(page).toHaveURL(/\/dashboard/);

    // find the doctor we created (disambiguate by email)
    const resp = await page.request.get(
      `/api/patient/search-doctors?name=${DOCTOR.firstName}`,
    );
    const json = await resp.json();
    const doc = json.data.doctors.find(
      (d: any) => d.email === DOCTOR.email,
    );
    expect(doc, "created doctor should appear in patient search").toBeTruthy();

    await page.goto(`/patient/doctors/${doc._id}`);
    await expect(
      page.getByRole("button", { name: /book appointment/i }),
    ).toBeEnabled();
    await page.getByRole("button", { name: /book appointment/i }).click();

    await page.fill("#date", "2026-07-10");
    await page.fill("#time", "10:30");
    await page.selectOption("#type", "Clinic");
    await page.fill("#reason", "Chest pain and palpitations");
    await page.getByRole("button", { name: /continue to payment/i }).click();

    // mock payment
    await page.getByRole("button", { name: /pay ₹/i }).click();
    await page.getByRole("button", { name: /view my appointments/i }).click();
    await expect(page).toHaveURL(/\/patient\/appointments/);
    // booking appears with its time slot and Pending status
    await expect(page.getByText("10:30 - 11:30")).toBeVisible();
    await expect(page.getByText("Pending")).toBeVisible();
  });

  test("TC-AUTH-02 — Login with a non-existent user shows an error, not a white screen", async ({
    page,
  }) => {
    await login(page, "nobody@test.com", "Whatever@1");
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-AUTH-01 negative — Registering a duplicate email shows an error, not a white screen", async ({
    page,
  }) => {
    const email = uniq("dup.user");
    await register(page, { ...ADMIN, email }, "Patient");
    await expect(page).toHaveURL(/\/dashboard/);

    // second attempt with the same email (must be logged out first)
    await logout(page);
    await page.goto("/register");
    await page.fill("#firstName", "Dup");
    await page.fill("#lastName", "User");
    await page.fill("#email", email);
    await page.fill("#phone", "+919999999999");
    await page.fill("#password", "Duplicate@1");
    await page.selectOption("#role", "Patient");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("TC-AUTH-01 negative — Weak password shows an inline error, no white screen", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.fill("#firstName", "Weak");
    await page.fill("#lastName", "Pass");
    await page.fill("#email", uniq("weak.pass"));
    await page.fill("#phone", "+919888777666");
    await page.fill("#password", "weak");
    await page.selectOption("#role", "Patient");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(
      page.getByText(/at least 8 characters/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
