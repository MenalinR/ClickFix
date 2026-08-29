const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "ClickFix <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message || "Failed to send email");
  }
};
