import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_PASS || "",
  },
});

export const sendResetPasswordEmail = async (email: string, resetLink: string) => {
  const mailOptions = {
    from: `"Poultry Connect Pro" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - Poultry Connect Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #ea580c; text-align: center;">Poultry Connect Pro</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #888;">${resetLink}</p>
        <p>This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Poultry Connect Pro &copy; 2026. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
