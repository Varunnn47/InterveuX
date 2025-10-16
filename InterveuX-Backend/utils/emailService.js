import nodemailer from 'nodemailer';

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️  Email credentials not configured. Password reset emails will not work.');
  console.log('Please configure EMAIL_USER and EMAIL_PASS in your .env file');
}

const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === 'development' && (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'your_gmail_app_password_here')
    ? {
        streamTransport: true,
        newline: 'unix',
        buffer: true
      }
    : {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
);

export const sendWelcomeEmail = async (email, name) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'app_password_here') {
    console.log('Email not configured, skipping welcome email');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to IntervueX - Your AI Interview Preparation Journey Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to IntervueX!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Hi ${name},</h2>
            <p style="color: #666; line-height: 1.6;">
              Welcome to IntervueX! We're excited to help you ace your next interview with our AI-powered preparation platform.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">What you can do:</h3>
              <ul style="color: #666;">
                <li>📄 Analyze your resume with AI feedback</li>
                <li>🎤 Practice mock interviews</li>
                <li>💻 Solve coding challenges</li>
                <li>📊 Track your progress</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Get Started Now
              </a>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Happy practicing!<br>
              The IntervueX Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'app_password_here') {
    console.log('Email not configured, skipping password reset email');
    return;
  }

  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your IntervueX Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #667eea; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">
              Or copy this link: ${resetUrl}
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
  }
};