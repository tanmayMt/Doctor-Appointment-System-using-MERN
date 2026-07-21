const nodemailer = require("nodemailer");
const moment = require("moment");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SENDER_GMAIL || !process.env.SENDER_GMAIL_PASSCODE) {
    console.warn(
      "[email] SENDER_GMAIL / SENDER_GMAIL_PASSCODE not set — emails will be skipped"
    );
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_GMAIL.trim(),
      pass: String(process.env.SENDER_GMAIL_PASSCODE).replace(/\s+/g, ""),
    },
  });
  return transporter;
};

const brand = {
  name: "Docmate",
  fromName: "Docmate Care",
};

const wrapHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e,#115e59);padding:20px 24px;color:#ffffff;">
            <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">${brand.name}</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">${title}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
            Thanks &amp; regards,<br/>
            Team ${brand.name}<br/>
            <span style="color:#94a3b8;">This is an automated message — please do not reply.</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const formatAppointmentWhen = (date, time) => {
  const d = date ? moment(date) : null;
  const t = time ? moment(time) : null;
  const dateStr = d && d.isValid() ? d.format("DD MMM YYYY") : String(date || "—");
  const timeStr = t && t.isValid() ? t.format("hh:mm A") : String(time || "—");
  return `${dateStr} at ${timeStr}`;
};

const doctorDisplayName = (doctorInfo) => {
  if (!doctorInfo) return "your doctor";
  if (doctorInfo.firstName || doctorInfo.lastName) {
    return `Dr. ${doctorInfo.firstName || ""} ${doctorInfo.lastName || ""}`.trim();
  }
  return doctorInfo.name || "your doctor";
};

const patientDisplayName = (userInfo) =>
  userInfo?.name || userInfo?.firstName || "Patient";

/**
 * Fire-and-forget email. Never throws to callers.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      console.warn("[email] skipped — missing recipient");
      return { skipped: true };
    }
    const tx = getTransporter();
    if (!tx) return { skipped: true };

    const info = await tx.sendMail({
      from: `"${brand.fromName}" <${process.env.SENDER_GMAIL}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`[email] sent to ${to}: ${info.response}`);
    return { success: true, info };
  } catch (error) {
    console.error("[email] send failed:", error.message);
    return { success: false, error };
  }
};

const sendWelcomeEmail = async ({ name, email }) => {
  const subject = `Welcome to ${brand.name}`;
  const html = wrapHtml(
    "Welcome aboard",
    `
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>Welcome to <strong>${brand.name}</strong> — your trusted place to find specialists and book appointments with confidence.</p>
    <p>You can now browse doctors, filter by specialty, and schedule consultations in a few clicks.</p>
    <p>We’re glad you’re here.</p>
  `
  );
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${name}, welcome to ${brand.name}!`,
  });
};

const sendLoginNotificationEmail = async ({ name, email, when = new Date() }) => {
  const subject = `${brand.name} login alert`;
  const at = moment(when).format("DD MMM YYYY, hh:mm A");
  const html = wrapHtml(
    "New sign-in",
    `
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>Your ${brand.name} account was signed in successfully on <strong>${at}</strong>.</p>
    <p>If this wasn’t you, please reset your password immediately and contact support.</p>
  `
  );
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${name}, your ${brand.name} account was signed in on ${at}.`,
  });
};

const sendBookingConfirmationToPatient = async ({
  patientEmail,
  patientName,
  doctorName,
  date,
  time,
}) => {
  const when = formatAppointmentWhen(date, time);
  const subject = `Appointment request received — ${brand.name}`;
  const html = wrapHtml(
    "Booking confirmation",
    `
    <p>Hi <strong>${patientName}</strong>,</p>
    <p>Your appointment request with <strong>${doctorName}</strong> has been submitted.</p>
    <p><strong>When:</strong> ${when}<br/>
    <strong>Status:</strong> Pending doctor approval</p>
    <p>You’ll receive another email once the doctor confirms or updates your request.</p>
  `
  );
  return sendEmail({
    to: patientEmail,
    subject,
    html,
    text: `Hi ${patientName}, your appointment with ${doctorName} on ${when} is pending approval.`,
  });
};

const sendNewAppointmentToDoctor = async ({
  doctorEmail,
  doctorName,
  patientName,
  date,
  time,
}) => {
  const when = formatAppointmentWhen(date, time);
  const subject = `New appointment request — ${brand.name}`;
  const html = wrapHtml(
    "New patient request",
    `
    <p>Hi <strong>${doctorName}</strong>,</p>
    <p>You have a new appointment request from <strong>${patientName}</strong>.</p>
    <p><strong>When:</strong> ${when}</p>
    <p>Please log in to ${brand.name} to approve or update this request.</p>
  `
  );
  return sendEmail({
    to: doctorEmail,
    subject,
    html,
    text: `New appointment from ${patientName} on ${when}.`,
  });
};

const sendAppointmentApprovedEmails = async ({
  patientEmail,
  patientName,
  doctorEmail,
  doctorName,
  date,
  time,
}) => {
  const when = formatAppointmentWhen(date, time);
  const patientHtml = wrapHtml(
    "Appointment confirmed",
    `
    <p>Hi <strong>${patientName}</strong>,</p>
    <p>Good news — your appointment with <strong>${doctorName}</strong> has been <strong>approved</strong>.</p>
    <p><strong>When:</strong> ${when}</p>
    <p>Please arrive a few minutes early and bring any relevant records.</p>
  `
  );
  const doctorHtml = wrapHtml(
    "Appointment approved",
    `
    <p>Hi <strong>${doctorName}</strong>,</p>
    <p>You approved the appointment with <strong>${patientName}</strong>.</p>
    <p><strong>When:</strong> ${when}</p>
    <p>It’s now confirmed on both calendars.</p>
  `
  );
  await Promise.all([
    sendEmail({
      to: patientEmail,
      subject: `Appointment confirmed with ${doctorName}`,
      html: patientHtml,
      text: `Your appointment with ${doctorName} on ${when} is confirmed.`,
    }),
    sendEmail({
      to: doctorEmail,
      subject: `Confirmed: appointment with ${patientName}`,
      html: doctorHtml,
      text: `You confirmed the appointment with ${patientName} on ${when}.`,
    }),
  ]);
};

const sendAppointmentCancelledEmails = async ({
  patientEmail,
  patientName,
  doctorEmail,
  doctorName,
  date,
  time,
  cancelledBy = "the system",
}) => {
  const when = formatAppointmentWhen(date, time);
  const patientHtml = wrapHtml(
    "Appointment cancelled",
    `
    <p>Hi <strong>${patientName}</strong>,</p>
    <p>Your appointment with <strong>${doctorName}</strong> on <strong>${when}</strong> has been <strong>cancelled</strong> (${cancelledBy}).</p>
    <p>You can book a new slot anytime from ${brand.name}.</p>
  `
  );
  const doctorHtml = wrapHtml(
    "Appointment cancelled",
    `
    <p>Hi <strong>${doctorName}</strong>,</p>
    <p>The appointment with <strong>${patientName}</strong> on <strong>${when}</strong> has been <strong>cancelled</strong> (${cancelledBy}).</p>
  `
  );
  await Promise.all([
    sendEmail({
      to: patientEmail,
      subject: `Appointment cancelled — ${brand.name}`,
      html: patientHtml,
      text: `Your appointment with ${doctorName} on ${when} was cancelled.`,
    }),
    sendEmail({
      to: doctorEmail,
      subject: `Appointment cancelled — ${patientName}`,
      html: doctorHtml,
      text: `Appointment with ${patientName} on ${when} was cancelled.`,
    }),
  ]);
};

const sendAppointmentRescheduledEmails = async ({
  patientEmail,
  patientName,
  doctorEmail,
  doctorName,
  oldDate,
  oldTime,
  newDate,
  newTime,
}) => {
  const oldWhen = formatAppointmentWhen(oldDate, oldTime);
  const newWhen = formatAppointmentWhen(newDate, newTime);
  const patientHtml = wrapHtml(
    "Appointment rescheduled",
    `
    <p>Hi <strong>${patientName}</strong>,</p>
    <p>Your appointment with <strong>${doctorName}</strong> has been <strong>rescheduled</strong>.</p>
    <p><strong>Previous:</strong> ${oldWhen}<br/>
    <strong>New:</strong> ${newWhen}</p>
  `
  );
  const doctorHtml = wrapHtml(
    "Appointment rescheduled",
    `
    <p>Hi <strong>${doctorName}</strong>,</p>
    <p>The appointment with <strong>${patientName}</strong> has been <strong>rescheduled</strong>.</p>
    <p><strong>Previous:</strong> ${oldWhen}<br/>
    <strong>New:</strong> ${newWhen}</p>
  `
  );
  await Promise.all([
    sendEmail({
      to: patientEmail,
      subject: `Appointment rescheduled — ${brand.name}`,
      html: patientHtml,
      text: `Your appointment with ${doctorName} moved from ${oldWhen} to ${newWhen}.`,
    }),
    sendEmail({
      to: doctorEmail,
      subject: `Appointment rescheduled — ${patientName}`,
      html: doctorHtml,
      text: `Appointment with ${patientName} moved from ${oldWhen} to ${newWhen}.`,
    }),
  ]);
};

/**
 * Resolve patient + doctor contact details from an appointment document.
 */
const resolveAppointmentParties = async (appointment, userModel, doctorModel) => {
  let patientEmail = appointment.userInfo?.email;
  let patientName = patientDisplayName(appointment.userInfo);
  let doctorEmail = appointment.doctorInfo?.email;
  let doctorName = doctorDisplayName(appointment.doctorInfo);

  if ((!patientEmail || !patientName) && appointment.userId) {
    const patient = await userModel.findById(appointment.userId).select("name email");
    if (patient) {
      patientEmail = patientEmail || patient.email;
      patientName = patientName || patient.name;
    }
  }

  if ((!doctorEmail || doctorName === "your doctor") && appointment.doctorId) {
    const doctor = await doctorModel.findById(appointment.doctorId);
    if (doctor) {
      doctorEmail = doctorEmail || doctor.email;
      doctorName = doctorDisplayName(doctor);
      if (!doctorEmail && doctor.userId) {
        const doctorUser = await userModel.findById(doctor.userId).select("email name");
        doctorEmail = doctorUser?.email;
      }
    }
  }

  return { patientEmail, patientName, doctorEmail, doctorName };
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendBookingConfirmationToPatient,
  sendNewAppointmentToDoctor,
  sendAppointmentApprovedEmails,
  sendAppointmentCancelledEmails,
  sendAppointmentRescheduledEmails,
  resolveAppointmentParties,
  doctorDisplayName,
  patientDisplayName,
  formatAppointmentWhen,
};
