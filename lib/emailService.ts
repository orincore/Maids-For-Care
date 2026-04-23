import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Hostinger uses a valid certificate — enforce it
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    // Hostinger shared hosting limits concurrent SMTP connections
    pool: true,
    maxConnections: 2,
    maxMessages: 10,
    rateDelta: 1000,
    rateLimit: 3,
    socketTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    dkim: process.env.DKIM_PRIVATE_KEY
      ? {
          domainName: process.env.SMTP_FROM_DOMAIN || '',
          keySelector: process.env.DKIM_SELECTOR || 'mail',
          privateKey: process.env.DKIM_PRIVATE_KEY,
        }
      : undefined,
  });
};

let _transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!_transporter) _transporter = createTransporter();
  return _transporter;
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BookingEmailData {
  userName: string;
  userEmail: string;
  bookingId: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  address?: string;
  specialInstructions?: string;
  providerName?: string;
  providerPhone?: string;
  paymentId?: string;
  cancellationReason?: string;
  oldProviderName?: string;
  newProviderName?: string;
  newProviderPhone?: string;
  reassignReason?: string;
  reassignComment?: string;
}

export interface ProviderEmailData {
  providerName: string;
  providerEmail: string;
  bookingId?: string;
  customerName?: string;
  serviceName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  address?: string;
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

const brandColor = '#1a1a2e';
const accentColor = '#7c3aed';
const fromName = process.env.SMTP_FROM_NAME || 'Maids For Care';
const fromEmail = process.env.SMTP_USER || 'noreply@maidsforcare.com';
const siteUrl = process.env.NEXTAUTH_URL || 'https://maidsforcare.com';

const emailLayout = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${brandColor};padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              🏠 Maids For Care
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Professional Home Services</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9fb;padding:24px 40px;border-top:1px solid #e8e8ec;text-align:center;">
            <p style="margin:0 0 8px;color:#888;font-size:12px;">
              © ${new Date().getFullYear()} Maids For Care · Mumbai, Maharashtra, India
            </p>
            <p style="margin:0;color:#aaa;font-size:11px;">
              You received this email because you have an account or booking with us.<br/>
              <a href="${siteUrl}" style="color:${accentColor};text-decoration:none;">Visit our website</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding:6px 0;font-size:14px;color:#666;width:42%;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:600;">${value}</td>
  </tr>
`;

const ctaButton = (text: string, url: string) => `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">${text}</a>
  </div>
`;

const badgePill = (text: string, bg: string, fg: string) =>
  `<span style="display:inline-block;background:${bg};color:${fg};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">${text}</span>`;

// ─── Templates ──────────────────────────────────────────────────────────────

const templates = {
  booking_created: (d: BookingEmailData) => ({
    subject: `Booking Received – ${d.serviceName} on ${d.scheduledDate}`,
    html: emailLayout('Booking Received', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Booking Received!</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.userName}</strong>, we've received your booking request. Payment will confirm it.</p>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Booking ID', `#${d.bookingId.slice(-8).toUpperCase()}`)}
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Scheduled', `${d.scheduledDate} at ${d.scheduledTime}`)}
          ${infoRow('Amount', `₹${d.totalAmount}`)}
          ${d.address ? infoRow('Address', d.address) : ''}
          ${d.specialInstructions ? infoRow('Instructions', d.specialInstructions) : ''}
        </table>
      </div>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">Complete your payment to confirm the booking. Our team will assign a verified professional shortly after.</p>
      ${ctaButton('Complete Payment', `${siteUrl}/dashboard`)}
    `),
    text: `Booking Received – ${d.serviceName} on ${d.scheduledDate}

Hi ${d.userName}, we've received your booking request. Payment will confirm it.

Booking ID: #${d.bookingId.slice(-8).toUpperCase()}
Service: ${d.serviceName}
Scheduled: ${d.scheduledDate} at ${d.scheduledTime}
Amount: Rs. ${d.totalAmount}
${d.address ? `Address: ${d.address}` : ''}
${d.specialInstructions ? `Instructions: ${d.specialInstructions}` : ''}

Complete your payment to confirm the booking. Our team will assign a verified professional shortly after.

Best,
Maids For Care`,
  }),

  payment_confirmed: (d: BookingEmailData) => ({
    subject: `Payment Confirmed - Booking #${d.bookingId.slice(-8).toUpperCase()}`,
    html: emailLayout('Payment Confirmed', `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:56px;height:56px;background:#dcfce7;border-radius:28px;text-align:center;vertical-align:middle;font-size:26px;font-weight:700;color:#16a34a;">&nbsp;&#10003;&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};text-align:center;">Payment Confirmed!</h2>
      <p style="margin:0 0 8px;color:#555;font-size:15px;text-align:center;">Your booking is now <strong>confirmed</strong>. We will assign a verified maid shortly.</p>
      <p style="margin:0 0 24px;color:#e57c00;font-size:13px;text-align:center;background:#fff8f0;border:1px solid #fde8c8;border-radius:6px;padding:10px 16px;">If you do not see this email, please check your <strong>Spam / Junk</strong> folder and mark it as Not Spam.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Booking ID', `#${d.bookingId.slice(-8).toUpperCase()}`)}
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Scheduled', `${d.scheduledDate} at ${d.scheduledTime}`)}
          ${infoRow('Amount Paid', `Rs. ${d.totalAmount}`)}
          ${d.paymentId ? infoRow('Payment Ref', d.paymentId) : ''}
          ${d.address ? infoRow('Address', d.address) : ''}
        </table>
      </div>
      ${d.providerName ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Assigned Maid</p>
          <p style="margin:0;font-size:15px;color:${brandColor};font-weight:700;">${d.providerName}</p>
          ${d.providerPhone ? `<p style="margin:4px 0 0;font-size:13px;color:#555;">Phone: ${d.providerPhone}</p>` : ''}
        </div>
      ` : ''}
      ${ctaButton('View My Booking', `${siteUrl}/dashboard`)}
    `),
    text: `Payment Confirmed - Booking #${d.bookingId.slice(-8).toUpperCase()}

Your booking is now confirmed. We will assign a verified maid shortly.

Booking ID: #${d.bookingId.slice(-8).toUpperCase()}
Service: ${d.serviceName}
Scheduled: ${d.scheduledDate} at ${d.scheduledTime}
Amount Paid: Rs. ${d.totalAmount}
${d.paymentId ? `Payment Ref: ${d.paymentId}` : ''}
${d.address ? `Address: ${d.address}` : ''}
${d.providerName ? `Assigned Maid: ${d.providerName}` : ''}
${d.providerPhone ? `Phone: ${d.providerPhone}` : ''}

Best,
Maids For Care`,
  }),

  booking_assigned: (d: BookingEmailData) => ({
    subject: `Maid Assigned – ${d.providerName} will serve you on ${d.scheduledDate}`,
    html: emailLayout('Maid Assigned', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Your Maid Has Been Assigned!</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.userName}</strong>, a verified professional has been assigned to your booking.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:13px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Service Professional</p>
        <p style="margin:0 0 4px;font-size:20px;color:${brandColor};font-weight:700;">${d.providerName}</p>
        ${d.providerPhone ? `<p style="margin:0;font-size:14px;color:#555;">📞 ${d.providerPhone}</p>` : ''}
      </div>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Date & Time', `${d.scheduledDate} at ${d.scheduledTime}`)}
          ${d.address ? infoRow('Address', d.address) : ''}
        </table>
      </div>
      ${ctaButton('View Booking', `${siteUrl}/dashboard`)}
    `),
  }),

  booking_reassigned: (d: BookingEmailData) => ({
    subject: `Maid Reassignment Notice – Booking #${d.bookingId.slice(-8).toUpperCase()}`,
    html: emailLayout('Maid Reassigned', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Maid Reassignment</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.userName}</strong>, we've updated the professional assigned to your booking.</p>
      ${d.oldProviderName ? `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#c2410c;font-weight:600;text-transform:uppercase;">Previous Maid</p>
        <p style="margin:0;font-size:15px;color:#1a1a2e;font-weight:600;">${d.oldProviderName}</p>
      </div>
      ` : ''}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#15803d;font-weight:600;text-transform:uppercase;">New Maid</p>
        <p style="margin:0 0 4px;font-size:15px;color:#1a1a2e;font-weight:600;">${d.newProviderName}</p>
        ${d.newProviderPhone ? `<p style="margin:0;font-size:13px;color:#555;">📞 ${d.newProviderPhone}</p>` : ''}
      </div>
      ${d.reassignReason ? `
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;">Reason</p>
        <p style="margin:0;font-size:14px;color:#555;">${d.reassignReason}${d.reassignComment ? ` — ${d.reassignComment}` : ''}</p>
      </div>
      ` : ''}
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Scheduled', `${d.scheduledDate} at ${d.scheduledTime}`)}
        </table>
      </div>
      ${ctaButton('View Booking', `${siteUrl}/dashboard`)}
    `),
  }),

  service_started: (d: BookingEmailData) => ({
    subject: `Service In Progress – ${d.serviceName}`,
    html: emailLayout('Service Started', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Your Service Has Started</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.userName}</strong>, <strong>${d.providerName || 'your maid'}</strong> has arrived and the service is now in progress.</p>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Started At', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}
          ${d.providerPhone ? infoRow('Maid Contact', d.providerPhone) : ''}
        </table>
      </div>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">If you have any concerns, please contact your maid directly or reach out to our support team.</p>
    `),
  }),

  service_completed: (d: BookingEmailData) => ({
    subject: `Service Completed – Please Leave a Review 🌟`,
    html: emailLayout('Service Completed', `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;">🎉</div>
      </div>
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};text-align:center;">Service Completed!</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;text-align:center;">Hi <strong>${d.userName}</strong>, your service has been completed successfully. We hope you're happy!</p>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', d.serviceName)}
          ${d.providerName ? infoRow('Maid', d.providerName) : ''}
          ${infoRow('Date', d.scheduledDate)}
          ${infoRow('Amount', `₹${d.totalAmount}`)}
        </table>
      </div>
      <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;color:#854d0e;font-weight:600;">How was your experience?</p>
        <p style="margin:0;font-size:13px;color:#a16207;">Your review helps other customers choose the right maid.</p>
      </div>
      ${ctaButton('Leave a Review', `${siteUrl}/dashboard`)}
    `),
  }),

  booking_cancelled: (d: BookingEmailData) => ({
    subject: `Booking Cancelled – #${d.bookingId.slice(-8).toUpperCase()}`,
    html: emailLayout('Booking Cancelled', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Booking Cancelled</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.userName}</strong>, your booking has been cancelled as requested.</p>
      <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Booking ID', `#${d.bookingId.slice(-8).toUpperCase()}`)}
          ${infoRow('Service', d.serviceName)}
          ${infoRow('Was Scheduled', `${d.scheduledDate} at ${d.scheduledTime}`)}
          ${infoRow('Amount', `₹${d.totalAmount}`)}
          ${d.cancellationReason ? infoRow('Reason', d.cancellationReason) : ''}
        </table>
      </div>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">If payment was made, a refund will be processed within 5–7 business days to your original payment method.</p>
      ${ctaButton('Book Again', `${siteUrl}/services`)}
    `),
  }),

  provider_registered: (d: ProviderEmailData) => ({
    subject: `Application Received – Maids For Care`,
    html: emailLayout('Application Received', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">Application Received!</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.providerName}</strong>, thank you for applying to become a service provider with Maids For Care.</p>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:14px;color:#555;">Here's what happens next:</p>
        <ol style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.8;">
          <li>Our team will review your documents (1–3 business days)</li>
          <li>We'll verify your identity and background</li>
          <li>Once approved, you'll receive a confirmation email</li>
          <li>You'll be able to start accepting bookings</li>
        </ol>
      </div>
      <p style="color:#888;font-size:13px;margin:0;">If you have any questions, reply to this email or contact <a href="mailto:support@maidsforcare.com" style="color:${accentColor};">support@maidsforcare.com</a>.</p>
    `),
  }),

  provider_new_booking: (d: ProviderEmailData) => ({
    subject: `New Booking Assigned – ${d.serviceName} on ${d.scheduledDate}`,
    html: emailLayout('New Booking', `
      <h2 style="margin:0 0 6px;font-size:24px;color:${brandColor};">New Booking Assigned!</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi <strong>${d.providerName}</strong>, a new booking has been assigned to you.</p>
      <div style="background:#f9f9fb;border:1px solid #e8e8ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Customer', d.customerName || 'Customer')}
          ${infoRow('Service', d.serviceName || '—')}
          ${infoRow('Scheduled', `${d.scheduledDate} at ${d.scheduledTime}`)}
          ${d.address ? infoRow('Address', d.address) : ''}
        </table>
      </div>
      <p style="color:#888;font-size:13px;margin:0;">Please be on time. If you have any issues, contact our support team immediately.</p>
    `),
  }),
};

// ─── Send Helper ────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured — skipping email to', to);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || subject,
      headers: {
        'X-Mailer': 'Maids-For-Care/1.0',
      },
    });
    console.log(`[Email] Sent "${subject}" to ${to} — messageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ─── Public fire-and-forget email functions ─────────────────────────────────
// Called directly from route handlers — no EventEmitter needed.
// Each function is synchronous from the caller's perspective (returns void)
// but sends the email asynchronously so it never blocks the HTTP response.

const fire = (to: string, subject: string, html: string, text?: string) => {
  sendEmail(to, subject, html, text).catch((err) =>
    console.error(`[Email] Unhandled send error to ${to}:`, err)
  );
};

export function sendBookingCreatedEmail(data: BookingEmailData): void {
  const t = templates.booking_created(data);
  fire(data.userEmail, t.subject, t.html, (t as any).text);
}

export function sendPaymentConfirmedEmail(data: BookingEmailData & { providerEmail?: string }): void {
  const t = templates.payment_confirmed(data);
  fire(data.userEmail, t.subject, t.html, (t as any).text);
  if (data.providerName && data.providerEmail) {
    const pt = templates.provider_new_booking({
      providerName: data.providerName,
      providerEmail: data.providerEmail,
      customerName: data.userName,
      serviceName: data.serviceName,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      address: data.address,
    });
    fire(data.providerEmail, pt.subject, pt.html);
  }
}

export function sendBookingAssignedEmail(data: BookingEmailData & { providerEmail?: string }): void {
  const t = templates.booking_assigned(data);
  fire(data.userEmail, t.subject, t.html);
  if (data.providerName && data.providerEmail) {
    const pt = templates.provider_new_booking({
      providerName: data.providerName,
      providerEmail: data.providerEmail,
      customerName: data.userName,
      serviceName: data.serviceName,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      address: data.address,
    });
    fire(data.providerEmail, pt.subject, pt.html);
  }
}

export function sendBookingReassignedEmail(data: BookingEmailData): void {
  const t = templates.booking_reassigned(data);
  fire(data.userEmail, t.subject, t.html);
}

export function sendServiceStartedEmail(data: BookingEmailData): void {
  const t = templates.service_started(data);
  fire(data.userEmail, t.subject, t.html);
}

export function sendServiceCompletedEmail(data: BookingEmailData): void {
  const t = templates.service_completed(data);
  fire(data.userEmail, t.subject, t.html);
}

export function sendBookingCancelledEmail(data: BookingEmailData): void {
  const t = templates.booking_cancelled(data);
  fire(data.userEmail, t.subject, t.html);
}

export function sendProviderRegisteredEmail(data: ProviderEmailData): void {
  const t = templates.provider_registered(data);
  fire(data.providerEmail, t.subject, t.html);
}
