import nodemailer from 'nodemailer';
import { IWaterReport, IUser } from '../models';

// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'leakageisues@gmail.com',
    pass: process.env.EMAIL_PASSWORD // This should be an app password, not regular password
  }
});

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private constructor() {}

  async sendReportStatusUpdate(report: IWaterReport, user: IUser, oldStatus: string): Promise<void> {
    try {
      const statusText = this.getStatusText(report.status);
      const oldStatusText = this.getStatusText(oldStatus);

      const mailOptions = {
        from: process.env.EMAIL_USER || 'leakageisues@gmail.com',
        to: user.email,
        subject: `Water Report Status Update - ${report._id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Water Leakage Report Update</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.full_name || user.email},</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Your water leakage report has been updated with a new status.
              </p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0;">Report Details:</h3>
                <p><strong>Report ID:</strong> ${report._id}</p>
                <p><strong>Issue Type:</strong> ${report.issue_type.replace(/_/g, ' ')}</p>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Location:</strong> ${report.location_address || 'GPS coordinates provided'}</p>
                <p><strong>Severity:</strong> <span style="color: ${this.getSeverityColor(report.severity)}; font-weight: bold;">${report.severity}</span></p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Status Update:</h3>
                <p style="font-size: 18px;">
                  <span style="color: #999; text-decoration: line-through;">${oldStatusText}</span>
                  <span style="margin: 0 10px;">→</span>
                  <span style="color: ${this.getStatusColor(report.status)}; font-weight: bold;">${statusText}</span>
                </p>
                
                ${report.status === 'RESOLVED' ? `
                  <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin-top: 15px;">
                    <p style="color: #155724; margin: 0; font-weight: bold;">
                      🎉 Great news! Your report has been resolved. Thank you for helping keep our community safe!
                    </p>
                  </div>
                ` : report.status === 'IN_PROGRESS' ? `
                  <div style="background: #cce5ff; border: 1px solid #99ccff; border-radius: 4px; padding: 15px; margin-top: 15px;">
                    <p style="color: #004085; margin: 0;">
                      🔧 Our team is actively working on resolving this issue. We'll keep you updated on the progress.
                    </p>
                  </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 14px;">
                  Thank you for using our Water Leakage Reporting System.<br>
                  Together, we're making our community safer and more sustainable.
                </p>
              </div>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.<br>
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Status update email sent to ${user.email} for report ${report._id}`);
    } catch (error) {
      console.error('Error sending status update email:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  async sendUserBanNotification(user: IUser, isBanned: boolean): Promise<void> {
    try {
      const subject = isBanned ? 'Account Suspended - Water Leakage System' : 'Account Reactivated - Water Leakage System';
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'leakageisues@gmail.com',
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${isBanned ? '#dc3545' : '#28a745'}; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">
                ${isBanned ? '🚫 Account Suspended' : '✅ Account Reactivated'}
              </h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.full_name || user.email},</h2>
              
              ${isBanned ? `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #721c24; margin-top: 0;">Account Suspended</h3>
                  <p style="color: #721c24; margin: 0;">
                    Your account has been suspended by our administrative team. This means you will no longer be able to:
                  </p>
                  <ul style="color: #721c24; margin: 10px 0;">
                    <li>Submit new water leakage reports</li>
                    <li>Access your account dashboard</li>
                    <li>Use mobile app features</li>
                  </ul>
                  <p style="color: #721c24; margin: 10px 0 0 0;">
                    If you believe this action was taken in error, please contact our support team for assistance.
                  </p>
                </div>
              ` : `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #155724; margin-top: 0;">Account Reactivated</h3>
                  <p style="color: #155724; margin: 0;">
                    Good news! Your account has been reactivated. You can now:
                  </p>
                  <ul style="color: #155724; margin: 10px 0;">
                    <li>Submit water leakage reports</li>
                    <li>Access your account dashboard</li>
                    <li>Use all mobile app features</li>
                  </ul>
                  <p style="color: #155724; margin: 10px 0 0 0;">
                    Thank you for your patience, and welcome back to our community!
                  </p>
                </div>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 14px;">
                  ${isBanned ? 
                    'If you have any questions about this suspension, please contact our support team.' :
                    'Thank you for being part of our Water Leakage Reporting System community.'
                  }
                </p>
              </div>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.<br>
                For support inquiries, please contact our administration team.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`${isBanned ? 'Ban' : 'Unban'} notification email sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending ${isBanned ? 'ban' : 'unban'} notification email:`, error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'RESOLVED':
        return 'Resolved';
      default:
        return status;
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return '#ffc107';
      case 'IN_PROGRESS':
        return '#007bff';
      case 'RESOLVED':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'LOW':
        return '#28a745';
      case 'MEDIUM':
        return '#ffc107';
      case 'HIGH':
        return '#fd7e14';
      case 'CRITICAL':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }
}

export const emailService = EmailService.getInstance();
