# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> MediBook happy path >> TC-AUTH-01 / TC-ADM-01 / TC-DOC-01 / TC-PAT-01 — full booking flow
- Location: e2e\happy-path.spec.ts:59:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.fill: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('#date')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "MediBook" [level=1] [ref=e9]
    - paragraph [ref=e10]: Doctor Appointment System
  - heading "Welcome back" [level=2] [ref=e11]
  - paragraph [ref=e12]: Sign in to your account
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: Email
      - textbox "Email" [ref=e16]:
        - /placeholder: you@example.com
    - generic [ref=e17]:
      - generic [ref=e18]: Password
      - textbox "Password" [ref=e19]:
        - /placeholder: ••••••••
    - button "Sign In" [ref=e20] [cursor=pointer]
  - generic [ref=e21]:
    - separator [ref=e22]
    - generic [ref=e23]: OR
    - separator [ref=e24]
  - generic [ref=e27]:
    - button "Sign in with Google. Opens in new tab" [ref=e29] [cursor=pointer]:
      - generic [ref=e31]:
        - img [ref=e33]
        - generic [ref=e40]: Sign in with Google
    - iframe
  - link "Forgot password?" [ref=e42] [cursor=pointer]:
    - /url: /forgot-password
  - generic [ref=e43]:
    - text: Don't have an account?
    - link "Register" [ref=e44] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | function uniq(prefix: string) {
  4   |   return `${prefix}+${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;
  5   | }
  6   | 
  7   | const ADMIN = {
  8   |   firstName: "Anil",
  9   |   lastName: "Kumar",
  10  |   email: uniq("anil.admin"),
  11  |   phone: "+919876543210",
  12  |   password: "Test@123",
  13  | };
  14  | 
  15  | const DOCTOR = {
  16  |   firstName: "Suresh",
  17  |   lastName: "Rao",
  18  |   email: uniq("dr.suresh"),
  19  |   phone: "+919812345678",
  20  |   password: "Doctor@123",
  21  |   specialization: "Cardiologist",
  22  |   experience: "12",
  23  |   qualification: "MD, DM Cardiology",
  24  |   fee: "500",
  25  |   city: "Hyderabad",
  26  | };
  27  | 
  28  | const PATIENT = {
  29  |   firstName: "Priya",
  30  |   lastName: "Singh",
  31  |   email: uniq("priya.patient"),
  32  |   phone: "+919800112233",
  33  |   password: "Patient@123",
  34  | };
  35  | 
  36  | async function register(page: any, user: any, role: string) {
  37  |   await page.goto("/register");
  38  |   await page.fill("#firstName", user.firstName);
  39  |   await page.fill("#lastName", user.lastName);
  40  |   await page.fill("#email", user.email);
  41  |   await page.fill("#phone", user.phone);
  42  |   await page.fill("#password", user.password);
  43  |   await page.selectOption("#role", role);
  44  |   await page.getByRole("button", { name: "Create Account" }).click();
  45  | }
  46  | 
  47  | async function login(page: any, email: string, password: string) {
  48  |   await page.goto("/login");
  49  |   await page.fill("#email", email);
  50  |   await page.fill("#password", password);
  51  |   await page.getByRole("button", { name: "Sign In" }).click();
  52  | }
  53  | 
  54  | async function logout(page: any) {
  55  |   await page.getByRole("button", { name: /logout/i }).click();
  56  | }
  57  | 
  58  | test.describe("MediBook happy path", () => {
  59  |   test("TC-AUTH-01 / TC-ADM-01 / TC-DOC-01 / TC-PAT-01 — full booking flow", async ({
  60  |     page,
  61  |   }) => {
  62  |     test.setTimeout(90000);
  63  | 
  64  |     // TC-AUTH-01: register Admin and auto-login
  65  |     await register(page, ADMIN, "Admin");
  66  |     await expect(page).toHaveURL(/\/dashboard/);
  67  | 
  68  |     // TC-ADM-01: add a doctor
  69  |     await page.goto("/admin/doctors");
  70  |     await page.getByRole("button", { name: "Add Doctor" }).click();
  71  |     await page.fill("#firstName", DOCTOR.firstName);
  72  |     await page.fill("#lastName", DOCTOR.lastName);
  73  |     await page.fill("#email", DOCTOR.email);
  74  |     await page.fill("#password", DOCTOR.password);
  75  |     await page.fill("#specialization", DOCTOR.specialization);
  76  |     await page.fill("#phone", DOCTOR.phone);
  77  |     await page.fill("#experience", DOCTOR.experience);
  78  |     await page.fill("#qualification", DOCTOR.qualification);
  79  |     await page.fill("#consultationFee", DOCTOR.fee);
  80  |     await page.fill("#clinicCity", DOCTOR.city);
  81  |     await page.getByRole("button", { name: "Add Doctor" }).click();
  82  |     // success collapses the form; verify the new doctor appears in the list
  83  |     await expect(page.getByText(DOCTOR.email)).toBeVisible();
  84  | 
  85  |     // TC-AUTH-02: login as the doctor
  86  |     await logout(page);
  87  |     await login(page, DOCTOR.email, DOCTOR.password);
  88  |     await expect(page).toHaveURL(/\/dashboard/);
  89  | 
  90  |     // TC-DOC-01: doctor adds a slot
  91  |     await page.goto("/doctor/schedule");
> 92  |     await page.fill("#date", "2026-07-10");
      |                ^ Error: page.fill: Test timeout of 90000ms exceeded.
  93  |     await page.fill("#startTime", "10:00");
  94  |     await page.fill("#endTime", "11:00");
  95  |     await page.fill("#maxPatients", "3");
  96  |     await page.getByRole("button", { name: /add slot/i }).click();
  97  |     await expect(page.getByText("Slot created!")).toBeVisible();
  98  | 
  99  |     // TC-PAT-01: register + login as patient
  100 |     await logout(page);
  101 |     await register(page, PATIENT, "Patient");
  102 |     await expect(page).toHaveURL(/\/dashboard/);
  103 | 
  104 |     // find the doctor we created (disambiguate by email)
  105 |     const resp = await page.request.get(
  106 |       `/api/patient/search-doctors?name=${DOCTOR.firstName}`,
  107 |     );
  108 |     const json = await resp.json();
  109 |     const doc = json.data.doctors.find(
  110 |       (d: any) => d.email === DOCTOR.email,
  111 |     );
  112 |     expect(doc, "created doctor should appear in patient search").toBeTruthy();
  113 | 
  114 |     await page.goto(`/patient/doctors/${doc._id}`);
  115 |     await expect(
  116 |       page.getByRole("button", { name: /book appointment/i }),
  117 |     ).toBeEnabled();
  118 |     await page.getByRole("button", { name: /book appointment/i }).click();
  119 | 
  120 |     await page.fill("#date", "2026-07-10");
  121 |     await page.fill("#time", "10:30");
  122 |     await page.selectOption("#type", "Clinic");
  123 |     await page.fill("#reason", "Chest pain and palpitations");
  124 |     await page.getByRole("button", { name: /continue to payment/i }).click();
  125 | 
  126 |     // mock payment
  127 |     await page.getByRole("button", { name: /pay ₹/i }).click();
  128 |     await page.getByRole("button", { name: /view my appointments/i }).click();
  129 |     await expect(page).toHaveURL(/\/patient\/appointments/);
  130 |     // booking appears with its time slot and Pending status
  131 |     await expect(page.getByText("10:30 - 11:30")).toBeVisible();
  132 |     await expect(page.getByText("Pending")).toBeVisible();
  133 |   });
  134 | 
  135 |   test("TC-AUTH-02 — Login with a non-existent user shows an error, not a white screen", async ({
  136 |     page,
  137 |   }) => {
  138 |     await login(page, "nobody@test.com", "Whatever@1");
  139 |     await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  140 |     await expect(page).toHaveURL(/\/login/);
  141 |   });
  142 | 
  143 |   test("TC-AUTH-01 negative — Registering a duplicate email shows an error, not a white screen", async ({
  144 |     page,
  145 |   }) => {
  146 |     const email = uniq("dup.user");
  147 |     await register(page, { ...ADMIN, email }, "Patient");
  148 |     await expect(page).toHaveURL(/\/dashboard/);
  149 | 
  150 |     // second attempt with the same email (must be logged out first)
  151 |     await logout(page);
  152 |     await page.goto("/register");
  153 |     await page.fill("#firstName", "Dup");
  154 |     await page.fill("#lastName", "User");
  155 |     await page.fill("#email", email);
  156 |     await page.fill("#phone", "+919999999999");
  157 |     await page.fill("#password", "Duplicate@1");
  158 |     await page.selectOption("#role", "Patient");
  159 |     await page.getByRole("button", { name: "Create Account" }).click();
  160 |     await expect(page.getByText(/already exists/i)).toBeVisible();
  161 |     await expect(page).toHaveURL(/\/register/);
  162 |   });
  163 | 
  164 |   test("TC-AUTH-01 negative — Weak password shows an inline error, no white screen", async ({
  165 |     page,
  166 |   }) => {
  167 |     await page.goto("/register");
  168 |     await page.fill("#firstName", "Weak");
  169 |     await page.fill("#lastName", "Pass");
  170 |     await page.fill("#email", uniq("weak.pass"));
  171 |     await page.fill("#phone", "+919888777666");
  172 |     await page.fill("#password", "weak");
  173 |     await page.selectOption("#role", "Patient");
  174 |     await page.getByRole("button", { name: "Create Account" }).click();
  175 |     await expect(
  176 |       page.getByText(/at least 8 characters/i),
  177 |     ).toBeVisible();
  178 |     await expect(page).toHaveURL(/\/register/);
  179 |   });
  180 | });
  181 | 
```