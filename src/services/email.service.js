const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const firstName = (name || '').trim();
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8000';

  const subject = 'Welcome to Bank Ledger';
  const text = `Dear ${firstName},\n\nYour Bank Ledger account has been created successfully. You can now sign in to view your account and transactions.\n\nFor your security, Bank Ledger will never ask for your password, PIN or OTP by email or phone.\n\nBank Ledger`;
  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;padding:32px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e0e0e0;border-top:4px solid #0b2545;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:28px 36px 0;font-size:18px;font-weight:bold;letter-spacing:0.5px;color:#0b2545;">
            BANK LEDGER
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 8px;color:#222222;font-size:15px;line-height:1.7;">
            <p style="margin:0 0 16px;">Dear ${firstName},</p>
            <p style="margin:0 0 16px;">Your Bank Ledger account has been <span style="font-weight:bold;color:#0b2545;">registered</span>  successfully. You can now sign in to view your account and transactions.</p>
            <p style="margin:0 0 24px;">
              <a href="${loginUrl}" style="display:inline-block;background-color:#0b2545;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:3px;font-size:14px;">Sign in to your account</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;border-left:3px solid #0b2545;">
              <tr>
                <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#444444;">
                  <strong>Security notice:</strong> Bank Ledger will never ask for your password, PIN or OTP by email, phone or message. If you did not create this account, contact us immediately.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px;border-top:1px solid #e0e0e0;font-size:12px;line-height:1.6;color:#777777;">
            This is an automated message. Please do not reply to this email.<br>
            &copy; ${new Date().getFullYear()} Bank Ledger. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  await sendEmail(userEmail, subject, text, html);
}


// async function sendTransactionEmail(userEmail, name, amount, toAccount) {
//   const subject = 'Transaction Successful!';
//   const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Bank Ledger Team`;
//   const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Bank Ledger Team</p>`;

//   await sendEmail(userEmail, subject, text, html);
// }
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful | Bank Ledger';

  const text = `
Dear ${name},

Your transaction has been completed successfully.

Transaction Amount: $${amount}
Recipient Account: ${toAccount}
Transaction Status: Successful

If you did not authorize this transaction, please contact our support team immediately.

Regards,
Bank Ledger Team
`;

  const html = `
    <div style="background:#f1f5f9;padding:40px 15px;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">

        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

            <!-- Header -->
            <div style="background:#0f2747;padding:28px 40px;">
                <h2 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">
                    BANK LEDGER
                </h2>
                <p style="margin:8px 0 0;color:#cbd5e1;font-size:12px;letter-spacing:1px;">
                    SECURE BANKING • SIMPLIFIED
                </p>
            </div>

            <!-- Main Content -->
            <div style="padding:35px 40px;">

                <p style="font-size:16px;margin:0 0 18px;">
                    Dear ${name},
                </p>

                <p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 28px;">
                    Your transaction has been processed successfully.
                    Here is a summary of your transaction.
                </p>

                <!-- Success Status -->
                <div style="text-align:center;margin-bottom:25px;">
                    <span style="display:inline-block;background:#ecfdf5;color:#047857;padding:9px 18px;border-radius:30px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">
                        ✓ &nbsp; TRANSACTION SUCCESSFUL
                    </span>
                </div>

                <!-- Amount Card -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:28px 20px;text-align:center;margin-bottom:25px;">

                    <p style="margin:0 0 10px;color:#64748b;font-size:13px;">
                        Transaction Amount
                    </p>

                    <h1 style="margin:0;color:#0f2747;font-size:34px;font-weight:700;">
                        $${amount}
                    </h1>

                    <p style="margin:12px 0 0;color:#16a34a;font-size:13px;">
                        Successfully transferred
                    </p>

                </div>

                <!-- Transaction Information -->
                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:25px;">

                    <h3 style="margin:0 0 18px;color:#0f2747;font-size:15px;">
                        Transaction Information
                    </h3>

                    <table style="width:100%;border-collapse:collapse;font-size:13px;">

                        <tr>
                            <td style="padding:14px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">
                                Recipient Account
                            </td>

                            <td style="padding:14px 0;text-align:right;color:#334155;font-weight:600;border-bottom:1px solid #f1f5f9;word-break:break-all;">
                                ${toAccount}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:14px 0;color:#64748b;">
                                Transaction Status
                            </td>

                            <td style="padding:14px 0;text-align:right;color:#16a34a;font-weight:600;">
                                Completed
                            </td>
                        </tr>

                    </table>
                </div>

                <!-- Security Notice -->
                <div style="background:#fff7ed;border-left:4px solid #f97316;padding:15px 18px;border-radius:4px;margin-bottom:25px;">

                    <p style="margin:0;color:#9a3412;font-size:12px;line-height:1.7;">
                        <strong>Security Notice</strong><br>
                        If you did not initiate this transaction, please contact our support team immediately.
                    </p>

                </div>

                <p style="font-size:14px;line-height:1.7;color:#475569;margin:0;">
                    Thank you for banking with us.
                </p>

                <p style="font-size:14px;line-height:1.7;color:#334155;margin-top:25px;">
                    Best regards,<br>
                    <strong style="color:#0f2747;">Bank Ledger Team</strong>
                </p>

            </div>

            <!-- Footer -->
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 40px;">

                <p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.6;">
                    This is an automated message. Please do not reply to this email.
                </p>

                <p style="margin:0;font-size:11px;color:#94a3b8;">
                    © 2026 Bank Ledger. All rights reserved.
                </p>

            </div>

        </div>
    </div>
    `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed';
  const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Bank Ledger Team`;
  const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Bank Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendRegistrationEmail };