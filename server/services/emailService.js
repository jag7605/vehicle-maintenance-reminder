const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Will be called in a future sprint when reminders are built
async function sendEmail(toEmail, subject, textContent) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: toEmail,
    subject: subject,
    text: textContent,
  });
}

module.exports = { sendEmail };