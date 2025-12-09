import transporter from "./nodemailer.js";

const emailTemplates = {
    // Email verification link
    verifyEmail: (verificationLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: blue;">Welcome to Wheelify!</h2>
      <p>Please verify your email address to complete your registration.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationLink}" style="display: inline-block; background: blue; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verificationLink}</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This link will expire in 24 hours.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `,


    // Password reset success confirmation
    passwordResetSuccess: () => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Password Changed Successfully</h2>
      <p>Your NayaSathi account password has been successfully updated.</p>
      <p>If you made this change, no further action is needed.</p>
      <p style="color: #ef4444; font-size: 14px;">If you didn't make this change, please secure your account immediately.</p>
    </div>
  `,

    // License upload notification
    licenseUploaded: (userName, verificationLink, licenseImage) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">License Uploaded</h2>
      <p>Hi ${userName || "there"},</p>
      <p>We received your license photo. Our admin team will review and approve it shortly.</p>
      <div style="margin: 16px 0;">
        <a href="${verificationLink}" style="display: inline-block; background: #1d4ed8; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View your license submission</a>
      </div>
      ${licenseImage ? `<img src="${licenseImage}" alt="License" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />` : ""}
      <p style="color: #64748b; font-size: 14px; margin-top: 16px;">If you didn't request this change, please contact support.</p>
    </div>
  `,

    // License upload notification to admin
    licenseUploadedAdmin: (userName, userEmail, reviewLink, licenseImage) => `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">New license submission</h2>
      <p>${userName || "A user"} just uploaded a license photo.</p>
      <p style="color: #475569;">User email: ${userEmail}</p>
      <div style="margin: 16px 0;">
        <a href="${reviewLink}" style="display: inline-block; background: #1d4ed8; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in admin panel</a>
      </div>
      ${licenseImage ? `<img src="${licenseImage}" alt="License" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />` : ""}
      <p style="color: #64748b; font-size: 13px; margin-top: 12px;">Approve or reject with a note. The user will be notified automatically.</p>
    </div>
  `,

    licenseApprovedUser: (userName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">License Approved</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Your license has been reviewed and approved. You’re now verified to proceed.</p>
      <p style="color: #64748b; font-size: 14px;">No further action is required.</p>
    </div>
  `,

    licenseRejectedUser: (userName, reviewNote) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">License Rejected</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Your license submission was reviewed and rejected.</p>
      ${reviewNote ? `<div style="padding: 12px; border: 1px solid #fecdd3; background: #fff1f2; border-radius: 8px; color: #b91c1c; margin: 12px 0;">${reviewNote}</div>` : ""}
      <p style="color: #64748b; font-size: 14px;">Please update your license photo and resubmit.</p>
    </div>
  `,

    // Ban notification
    banNotification: (userName, remarks, adminEmail) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Account Suspension Notice</h2>
      <p>Dear ${userName},</p>
      <p>Your NayaSathi account has been temporarily suspended due to violation of our community guidelines.</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Suspension Details:</h3>
        <p><strong>Reason:</strong> ${remarks || "Violation of terms of service"}</p>
        <p><strong>Action By:</strong> ${adminEmail}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>During this suspension, you won't be able to access your account.</p>
      <p>If you believe this was a mistake, please contact our support team.</p>
      <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  `,

    // Unban notification
    unbanNotification: (userName, adminEmail) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Account Access Restored</h2>
      <p>Dear ${userName},</p>
      <p>Your NayaSathi account suspension has been lifted and full access has been restored.</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Action By:</strong> ${adminEmail}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>You may now log in and use all platform features.</p>
      <p>Please review our community guidelines to ensure compliance.</p>
      <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>

  `,
  listingApproved: (vendorName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10b981;">Listing Approved</h2>
    <p>Dear ${vendorName},</p>
    <p>Your listing has been approved.</p>
  </div>
  `,
  listingRejected: (vendorName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ef4444;">Listing Rejected</h2>
    <p>Dear ${vendorName},</p>
    <p>Your listing has been rejected.</p>
  </div>
  `,
  vendorApproved: (vendorName, message) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10b981;">Vendor Application Approved - Wheelify</h2>
    <p>Dear ${vendorName},</p>
    <p>Congratulations! Your vendor application has been approved.</p>
    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 0; font-weight: 600; color: #166534;">Approval Message:</p>
      <p style="margin: 10px 0 0 0; color: #166534;">${message || "Your vendor application has been reviewed and approved. You can now access the vendor dashboard and start listing your vehicles."}</p>
    </div>
    <p>You can now log in to your account and access the vendor dashboard to manage your vehicles and rentals.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/vendor" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Vendor Dashboard</a>
    </div>
    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">If you have any questions, please contact our support team.</p>
    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply directly to this email.</p>
  </div>
  `,
  vendorRejected: (vendorName, message) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ef4444;">Vendor Application Rejected - Wheelify</h2>
    <p>Dear ${vendorName},</p>
    <p>We regret to inform you that your vendor application has been rejected.</p>
    <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">Rejection Reason:</p>
      <p style="margin: 10px 0 0 0; color: #991b1b;">${message || "Your application did not meet our requirements."}</p>
    </div>
    <p>If you believe this was a mistake or would like to reapply with additional information, please contact our support team.</p>
    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">You can submit a new application after addressing the issues mentioned above.</p>
    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply directly to this email.</p>
  </div>
  `,
  vendorApplicationSubmittedAdmin: (userName, userEmail, reviewLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
    <h2 style="color: #1d4ed8;">New Vendor Application Submitted - Wheelify</h2>
    <p>Hello Admin,</p>
    <p>A new vendor application has been submitted and requires your review.</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1d4ed8;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e293b;">Applicant Details:</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Name:</strong> ${userName || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Email:</strong> ${userEmail || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div style="margin: 20px 0;">
      <a href="${reviewLink}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Application</a>
    </div>
    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Please review the application and approve or reject it with appropriate feedback.</p>
    <p style="color: #64748b; font-size: 14px;">This is an automated notification. Please do not reply directly to this email.</p>
  </div>
  `,
  newUserSignupAdmin: (userName, userEmail, userContact, userAddress, viewUsersLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
    <h2 style="color: #1d4ed8;">New User Signup - Wheelify</h2>
    <p>Hello Admin,</p>
    <p>A new user has signed up on Wheelify.</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1d4ed8;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e293b;">User Details:</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Name:</strong> ${userName || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Email:</strong> ${userEmail || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Contact:</strong> ${userContact || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Address:</strong> ${userAddress || "N/A"}</p>
      <p style="margin: 4px 0; color: #475569;"><strong>Signed up:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div style="margin: 20px 0;">
      <a href="${viewUsersLink}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Users</a>
    </div>
    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">The user will need to verify their email before they can log in.</p>
    <p style="color: #64748b; font-size: 14px;">This is an automated notification. Please do not reply directly to this email.</p>
  </div>
  `
};

const sendEmail = async (email, type, data) => {
    const templateConfig = {
        // Verification emails
        'verify-email': {
            subject: 'Verify Your Email - Wheelify',
            template: emailTemplates.verifyEmail(data.verificationLink)
        },
        'password-reset-success': {
            subject: 'Password Changed Successfully',
            template: emailTemplates.passwordResetSuccess()
        },
        'license-uploaded': {
            subject: 'License Submitted - Wheelify',
            template: emailTemplates.licenseUploaded(data.userName, data.verificationLink, data.licenseImage)
        },
        'license-uploaded-admin': {
            subject: 'New License Submission - Wheelify',
            template: emailTemplates.licenseUploadedAdmin(data.userName, data.userEmail, data.reviewLink, data.licenseImage)
        },
        'license-approved-user': {
            subject: 'Your License Was Approved - Wheelify',
            template: emailTemplates.licenseApprovedUser(data.userName)
        },
        'license-rejected-user': {
            subject: 'Your License Was Rejected - Wheelify',
            template: emailTemplates.licenseRejectedUser(data.userName, data.reviewNote)
        },

        'account-banned': {
            subject: 'Account Suspension Notice',
            template: emailTemplates.banNotification(data.userName, data.remarks, data.adminEmail)
        },
        'account-unbanned': {
            subject: 'Account Access Restored',
            template: emailTemplates.unbanNotification(data.userName, data.adminEmail)
        },
        'listing-approved': {
            subject: 'Listing Approved',
            template: emailTemplates.listingApproved(data.listingName)
        },
        'listing-rejected': {
            subject: 'Listing Rejected',
            template: emailTemplates.listingRejected(data.vendorName)
        },
        'vendor-approved': {
            subject: 'Vendor Application Approved - Wheelify',
            template: emailTemplates.vendorApproved(data.vendorName, data.message)
        },
        'vendor-rejected': {
            subject: 'Vendor Application Rejected - Wheelify',
            template: emailTemplates.vendorRejected(data.vendorName, data.message)
        },
        'vendor-application-submitted-admin': {
            subject: 'New Vendor Application Submitted - Wheelify',
            template: emailTemplates.vendorApplicationSubmittedAdmin(data.userName, data.userEmail, data.reviewLink)
        },
        'new-user-signup-admin': {
            subject: 'New User Signup - Wheelify',
            template: emailTemplates.newUserSignupAdmin(data.userName, data.userEmail, data.userContact, data.userAddress, data.viewUsersLink)
        }
    };

    if (!templateConfig[type]) {
        throw new Error('Invalid email type');
    }

    const mailOptions = {
        from: `"Wheelify" <${process.env.SMTP_MAIL}>`,
        to: email,
        subject: templateConfig[type].subject,
        html: templateConfig[type].template
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send ${type} email`);
    }
};



export default sendEmail;