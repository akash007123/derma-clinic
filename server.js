require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json()); // Use express built-in JSON parser

// Ensure required environment variables are present
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
  console.error("❌ Missing required environment variables!");
  process.exit(1); // Stop the server if env variables are missing
}

// Load environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const PORT = process.env.PORT || 5000;

// Debug logs (useful for Render logs)
console.log("✅ Server starting with:");
console.log("📧 Email User:", EMAIL_USER);
console.log("👤 Admin Email:", ADMIN_EMAIL);
console.log("🚀 Server Port:", PORT);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify transporter (to catch email authentication errors)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready.");
  }
});

// Handle email sending
app.post("/send-mail", async (req, res) => {
  console.log("📩 Received request:", req.body);

  const { Name, Email, Mobile, Date, Time, Service } = req.body;

  if (!Name || !Email || !Mobile || !Date || !Time || !Service) {
    return res.status(400).json({ error: "❌ All fields are required." });
  }

  const userMailOptions = {
    from: EMAIL_USER,
    to: Email,
    subject: "Appointment Confirmation",
    html: `<p>Dear ${Name},</p>
           <p>Your appointment for <strong>${Service}</strong> has been confirmed.</p>
           <p><strong>Date:</strong> ${Date}</p>
           <p><strong>Time:</strong> ${Time}</p>
           <img src="https://lh3.googleusercontent.com/p/AF1QipNHwczy8exThH7v40O4KrD9j5CMXqidK6NZkcpG=s680-w680-h510" 
              alt="Appointment Confirmation" 
              style="width:100%;max-width:600px;display:block;margin-top:10px; height:auto;">
           <p>We look forward to seeing you!</p>`,
  };

  const adminMailOptions = {
    from: EMAIL_USER,
    to: ADMIN_EMAIL,
    subject: "New Appointment Booking",
    html: `<p>A new appointment has been booked:</p>
           <p><strong>Name:</strong> ${Name}</p>
           <p><strong>Email:</strong> ${Email}</p>
           <p><strong>Phone:</strong> ${Mobile}</p>
           <p><strong>Date:</strong> ${Date}</p>
           <p><strong>Time:</strong> ${Time}</p>
           <p><strong>Service:</strong> ${Service}</p>`,
  };

  try {
    // Send emails concurrently
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    console.log("✅ Emails sent successfully.");
    res.status(200).json({ message: "✅ Emails sent successfully!" });
  } catch (error) {
    console.error("❌ Email error:", error);
    res.status(500).json({ error: "❌ Failed to send emails. " + error.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
