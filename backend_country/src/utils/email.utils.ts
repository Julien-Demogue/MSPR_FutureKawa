import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function createEmailTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_APP_PASSWORD
        },
        secure: true,
        port: 465
    });
}

export async function sendEmail(to: string, subject: string, html: string) {
    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_ADDRESS,
        to,
        subject,
        html
    });
}
