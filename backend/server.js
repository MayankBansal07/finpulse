const express = require('express');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const connectDB = require('./config/db');
const Consultation = require('./models/Consultation');
const User = require('./models/User'); // Added for seeding
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

connectDB();

const allowedOrigins = [
  "https://finpulse.works",
  "https://www.finpulse.works",
  "https://finpulse-v2.vercel.app",
  "https://finpulse-frontend.vercel.app",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5502",
  "http://localhost:5502",
  "http://localhost:5005",
  "http://127.0.0.1:5005",
  "http://127.0.0.1:8080",
  "http://localhost:8080"
];

const isLocalhostOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch (error) {
    return false;
  }
};

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !isLocalhostOrigin(origin)) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Main Data Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Configure SMTP transporter for Gmail (587 with TLS)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // logger: true,   // log to console
  // debug: true     // include SMTP conversation
  family: 4 // Use IPv4 to avoid potential IPv6 issues
});


app.get("/", (req, res) => {
  res.send("Backend is live");
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!email || !email.includes("@") || !email.includes(".")) {
    return res.status(400).json({ message: "Invalid email" });
  }

  console.log("New submission:", name, email);

  try {
    // 0. Save Consultation Request to Database
    await Consultation.create({
      name,
      email,
      phone: req.body.phone || '',
      service: req.body.service || '',
      message
    });

    // 1. Admin notification
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,        // ✅ must match your Gmail login
        to: process.env.SMTP_USER,          // ✅ admin notification goes to your Gmail
        replyTo: email,                     // ✅ lets you reply directly to the customer
        subject: "New Contact Form",
        text: `New request from ${name} (${email}): ${message}`, // plain text fallback
        html: `
      <h3>New Contact Request</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b> ${message}</p>
    `
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,        // ✅ must match your Gmail login
        to: email,                          // ✅ customer’s email
        replyTo: process.env.SMTP_USER,     // ✅ replies come back to you
        subject: "FinPulse – Consultation Request Received",
        text: `Hello ${name}, we received your message: "${message}". We'll contact you soon.`,
        html: `
      <h3>Hello ${name},</h3>
      <p>We received your message:</p>
      <p>"${message}"</p>
      <br/>
      <p>We will contact you soon.</p>
      <p><b>FinPulse Team</b></p>
    `
      });
      console.log("Customer mail sent:", info.messageId);
    } catch (emailError) {
      console.error("Email notification failed to send, but data was saved:", emailError.message);
    }

    res.json({ success: true });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});
// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Seed an initial Admin user if none exists
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: process.env.SMTP_USER || 'admin@finpulse.com',
        password: 'AdminPassword123!',
        role: 'admin'
      });
      console.log("Default Admin created. Email: Use your SMTP_USER or admin@finpulse.com. Password: AdminPassword123!");
    }
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
  }
};

app.listen(PORT, async () => {
  await seedAdmin(); // Check for admin right when server starts
  console.log(`Server running on port ${PORT}`);
});
