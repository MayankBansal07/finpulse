require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const connectDB = require('./config/db');
const Consultation = require('./models/Consultation');
const User = require('./models/User'); // Added for seeding
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

connectDB().then(async () => {
  try {
    const masterEmail = 'project.test.2805@gmail.com';
    const masterExists = await User.findOne({ email: masterEmail });
    if (!masterExists) {
      await User.create({
        name: 'Master Admin',
        email: masterEmail,
        password: 'AdminPassword123!',
        role: 'admin'
      });
      console.log('✅ Master Admin Account Seeded.');
    }
  } catch (error) {
    console.error('Error seeding Master Admin:', error);
  }
});
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Main Data Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Configure Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Keeping nodemailer transporter for legacy/system mails if needed, 
// but we will primarily use Resend for public contact forms.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  family: 4
});


// Helper for Fail-safe Email Delivery
const sendFinPulseMail = async ({ to, subject, html, replyTo, type }) => {
  const fromEmail = "consult@finpulse.works";
  
  // Attempt 1: Resend
  try {
    console.log(`[Email] Attempting Resend for ${type}...`);
    const { data, error } = await resend.emails.send({
      from: type === 'Admin' ? `FinPulse Website <${fromEmail}>` : `FinPulse Consultation <${fromEmail}>`,
      to,
      reply_to: replyTo,
      subject,
      html
    });

    if (!error && data && data.id) {
      console.log(`[Email] Resend SUCCESS for ${type}: ${data.id}`);
      return { success: true, provider: 'resend', id: data.id };
    }
    console.error(`[Email] Resend FAILED for ${type}:`, error || 'Unknown Error');
  } catch (err) {
    console.error(`[Email] Resend EXCEPTION for ${type}:`, err.message);
  }

  // Attempt 2: Fallback to Zoho (Nodemailer)
  try {
    console.log(`[Email] Falling back to ZOHO for ${type}...`);
    const mailOptions = {
      from: `"FinPulse" <${fromEmail}>`,
      to,
      replyTo,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ZOHO SUCCESS for ${type}: ${info.messageId}`);
    return { success: true, provider: 'zoho', id: info.messageId };
  } catch (err) {
    console.error(`[Email] ZOHO FAILED for ${type}:`, err.message);
    return { success: false, error: err.message };
  }
};

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
      message,
      consent: req.body.consent || false
    });

    // 1. Admin Notification (Independent)
    sendFinPulseMail({
      to: "consult@finpulse.works",
      replyTo: email,
      subject: "New Contact Form Submission",
      type: "Admin",
      html: `
        <h3>New Contact Request</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${req.body.phone || 'N/A'}</p>
        <p><b>Service:</b> ${req.body.service || 'N/A'}</p>
        <p><b>Message:</b> ${message}</p>
      `
    });

    // 2. Customer Auto-reply (Independent)
    sendFinPulseMail({
      to: email,
      replyTo: "consult@finpulse.works",
      subject: "FinPulse – Consultation Request Received",
      type: "Customer",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2ECC71; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">FinPulse Consultation</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <h3>Hello ${name},</h3>
            <p>Thank you for reaching out to FinPulse. We have received your consultation request and confirmed your consent for us to contact you regarding your financial needs.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin-top: 0; color: #64748b; font-size: 0.9rem;">Your Message Summary:</p>
              <p style="font-style: italic; color: #1a365d; border-left: 3px solid #2ECC71; padding-left: 15px;">"${message}"</p>
            </div>
            
            <p>One of our expert Chartered Accountants will review your details and contact you within the next 24 hours.</p>
            <br/>
            <p>Warm regards,</p>
            <p><b>The FinPulse Team</b></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated response based on your consent. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    });

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
        email: process.env.SMTP_USER || 'admin@finpulse.works',
        password: 'AdminPassword123!',
        role: 'admin'
      });
      console.log("Default Admin created. Email: Use your SMTP_USER or admin@finpulse.works. Password: AdminPassword123!");
    }
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
  }
};

app.listen(PORT, async () => {
  console.log("------------------------------------------");
  console.log("--- FINPULSE BACKEND V3 (FAILSAFE) LIVE ---");
  console.log("------------------------------------------");
  await seedAdmin(); // Check for admin right when server starts
  console.log(`Server running on port ${PORT}`);
});
