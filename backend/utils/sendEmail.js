import nodemailer from "nodemailer";
import { sendGmailApiMail } from "./gmailMailer.js";

const getTransporter = () => {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_APP_PASSWORD?.replace(/\s+/g, "");

    if (!user || !pass) {
        throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user,
            pass
        }
    });
};

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const FROM_NAME = "ZoomRTC";

const maskEmail = (email = "") => {
    const [localPart, domain] = email.split("@");
    if (!domain) return "[invalid email]";
    return `${localPart.slice(0, 1)}***@${domain}`;
};

const deliverMail = async (mailOptions) => {
    if (process.env.EMAIL_PROVIDER === "gmail-api" || process.env.GOOGLE_REFRESH_TOKEN) {
        return sendGmailApiMail(mailOptions);
    }

    // Render free web services block SMTP ports, so use an HTTPS mail API there.
    if (process.env.RESEND_API_KEY) {
        if (!process.env.MAIL_FROM) {
            throw new Error("Set MAIL_FROM to an address on a verified Resend domain.");
        }

        console.debug("[email] Sending through Resend", {
            to: maskEmail(mailOptions.to),
            from: process.env.MAIL_FROM
        });

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM,
                to: [mailOptions.to],
                subject: mailOptions.subject,
                html: mailOptions.html
            })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            const providerMessage = result.message || result.name || "Unknown provider error";
            console.error("[email] Resend rejected message", {
                status: response.status,
                to: maskEmail(mailOptions.to),
                error: providerMessage
            });
            throw new Error(providerMessage);
        }
        console.info("[email] Resend accepted message", {
            id: result.id || "not returned",
            to: maskEmail(mailOptions.to),
            note: "Accepted by provider; check Resend Emails for final delivery status."
        });
        return;
    }

    if (process.env.RENDER) {
        throw new Error("Render cannot send SMTP mail on this plan. Configure RESEND_API_KEY and MAIL_FROM in the Render environment.");
    }

    const transporter = getTransporter();
    console.debug("[email] Sending through Gmail SMTP", { to: maskEmail(mailOptions.to) });
    const result = await transporter.sendMail(mailOptions);
    console.info("[email] Gmail SMTP accepted message", {
        messageId: result.messageId,
        to: maskEmail(mailOptions.to),
        acceptedCount: result.accepted?.length || 0
    });
};

export const sendVerificationEmail = async (email, otp) => {

    const mailOptions = {
        from: process.env.MAIL_FROM || `"${FROM_NAME}" <${process.env.EMAIL_USER?.trim() || "no-reply@localhost"}>`,
        to: email,
        subject: "Verify Your Email — SyncMeet",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E14; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B;">
                <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SyncMeet</h1>
                </div>
                <div style="padding: 40px 30px; color: #E2E8F0; text-align: center;">
                    <p style="font-size: 16px; line-height: 1.6;">Thanks for signing up! Enter the 6-digit code below to verify your email address:</p>
                    <div style="margin: 40px 0;">
                        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818CF8; padding: 15px 30px; border-radius: 12px; font-weight: 800; font-size: 32px; letter-spacing: 6px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #94A3B8;">This code expires in 10 minutes. Do not share it with anyone.</p>
                </div>
            </div>
        `
    };

    try {
        await deliverMail(mailOptions);
    } catch (error) {
        console.error("Verification email delivery failed:", error.code || error.name, error.responseCode || "", error.message);
        throw new Error("We couldn't send the verification email. Check the email settings and try resending.");
    }
};

export const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.MAIL_FROM || `"${FROM_NAME}" <${process.env.EMAIL_USER?.trim() || "no-reply@localhost"}>`,
        to: email,
        subject: "Reset Your Password — ZoomRTC",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E14; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
                </div>
                <div style="padding: 40px 30px; color: #E2E8F0;">
                    <p style="font-size: 16px; line-height: 1.6;">You requested a password reset. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #94A3B8;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        `
    };

    try {
        await deliverMail(mailOptions);
    } catch (error) {
        console.error("Password reset email delivery failed:", error.code || error.name, error.responseCode || "", error.message);
        throw new Error("We couldn't send the password reset email. Check the email settings and try again.");
    }
};
