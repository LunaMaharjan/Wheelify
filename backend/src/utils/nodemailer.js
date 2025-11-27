import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validate SMTP configuration
const smtpService = process.env.SMTP_SERVICE;
const smtpMail = process.env.SMTP_MAIL;
const smtpPass = process.env.SMTP_PASS;

if (!smtpService || !smtpMail || !smtpPass) {
    console.warn('⚠️  SMTP configuration is missing. Email functionality will not work.');
    console.warn('Please set SMTP_SERVICE, SMTP_MAIL, and SMTP_PASS in your .env file');
}

const transporter = nodemailer.createTransport({
    service: smtpService,
    auth: {
        user: smtpMail,
        pass: smtpPass
    }
});

// Verify transporter configuration
if (smtpService && smtpMail && smtpPass) {
    transporter.verify(function (error, success) {
        if (error) {
            console.error('❌ SMTP configuration error:', error);
        } else {
            console.log('✅ SMTP server is ready to send emails');
        }
    });
}

export default transporter;