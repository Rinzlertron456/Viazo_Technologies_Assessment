You're absolutely right to call this out. Here's the honest explanation for each:

---

## 1. File Upload — BRD Reference: ✅ YES, it's in the BRD

**BRD mentions:**
- Patient booking workflow: *"Select Doctor → ... → Upload Reports → Payment → Confirmation"*
- Patient Profile: *"Documents: Aadhaar, Insurance Card, Medical Reports"*
- Doctor consultation: *"Upload Files"*

**What was built:** Backend has `POST /api/upload` with multer (5MB limit, images/PDFs only), saved to `uploads/` directory, returns the file URL. It's registered in app.ts and working.

**What was NOT built (my omission):** The frontend `BookAppointment.tsx` form doesn't have a file input to actually upload reports during booking. The `PatientProfile.tsx` doesn't have document upload for Aadhaar/Insurance card. I built the backend pipe but never connected the frontend tap.

**Honest reason it's marked ❌:** I prioritized the core booking flow over file upload UI. The backend is ready — it just needs a `<input type="file">` and an API call to `/api/upload` added to the booking form. That's roughly 30 minutes of work.

---

## 2. Payment — BRD Reference: ✅ YES, it's in the BRD

**BRD mentions:**
- *"Payment Gateway: UPI, Credit Card, Debit Card, Net Banking, Wallet"*
- *"Invoices, Refund, Payment History"*
- Integration: *"Razorpay, Stripe, PayPal"*
- Booking workflow: *"... → Payment → Confirmation"*

**What was built:** Backend has `POST /api/payment/create-order` (mock order) and `POST /api/payment/verify` (marks bill as Paid). The `Bill` model exists with invoice numbers, payment status tracking.

**What was NOT built (my omission):** There's no payment step in the frontend booking flow. Currently `BookAppointment.tsx` sends you straight to confirmation — there's no payment UI showing the amount, no "Pay Now" button, no UPI/Card/NetBanking selection screen, no mock payment success page. The BRD clearly shows payment as a step between reason-entry and confirmation.

**Honest reason it's marked ❌:** Real payment integration (Razorpay/Stripe) requires API keys and a merchant account — those weren't available. I built the backend to accept verification. But I should have at least built a frontend "payment" screen that shows the amount and has a "Pay Now" button that calls the mock API. I simply didn't build that screen.

---

## 3. Notifications — BRD Reference: ✅ YES, it's in the BRD

**BRD mentions:**
- *"Notification System: Appointment Reminder, Prescription Ready, Medicine Reminder, Follow-up Reminder"*
- *"Receive SMS, Email, Push Notification"*
- *"For: Booking, Cancellation, Reschedule, Prescription Ready"*
- Integration: *"SMS Gateway, Email Service, WhatsApp Notifications"*

**What was built:** Backend has `emailService.ts` (console.logs the email content), `notificationService.ts` (templates for booking confirmation, cancellation, prescription ready), and they're wired into the `bookAppointment` and `cancelAppointment` controller functions.

**What's incomplete:** The notifications only `console.log` — there's no real SMTP/Nodemailer setup to actually send emails. The BRD asks for "Email Service" integration (real emails) plus SMS and push notifications.

**Honest reason it's marked ❌:** Real email requires SMTP credentials and Nodemailer. Real SMS requires Twilio or similar. Push notifications require Firebase or WebSocket. These are external services that need configuration. The MVP pattern works for testing (you'll see the email in your server console when you book/cancel) but it's not production-ready. I should have noted this more clearly.

---

## The bottom line

| Item | In BRD? | Backend | Frontend | What's actually missing |
|---|---|---|---|---|
| File Upload | ✅ Yes | ✅ Ready | ❌ Missing | File input on booking form + patient documents |
| Payment | ✅ Yes | ✅ Ready | ❌ Missing | Payment step screen in booking flow |
| Notifications | ✅ Yes | ✅ Ready (console) | ❌ MVP only | Real SMTP/SMS provider setup |

All three **backends are built and working**. What's missing is the frontend UI layer for upload and payment, plus real provider configuration for email. Each is a relatively contained task — if you want, I can toggle to Act Mode and build all three frontend UIs (file upload input on booking, payment screen, email config) in the next session.