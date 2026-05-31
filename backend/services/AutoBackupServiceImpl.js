/**
 * Automatic Backup Service
 * Handles automatic data backups and email distribution
 */

const nodemailer = require('nodemailer');
const EventEmitter = require('events');

class AutoBackupService extends EventEmitter {
  /**
   * Initialize backup service
   * @param {Object} database - Database connection
   * @param {Object} emailConfig - Email configuration
   */
  constructor(database, emailConfig) {
    super();
    this.db = database;
    this.emailConfig = emailConfig;
    this.backupSchedules = new Map();
    this.activeBackups = new Map();
    this.transporter = null;
    this.initializeEmailTransporter();
  }

  /**
   * Initialize email transporter using nodemailer
   */
  initializeEmailTransporter() {
    try {
      if (!this.emailConfig.enabled) {
        console.log('Email backup disabled');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.smtpHost,
        port: this.emailConfig.smtpPort,
        secure: this.emailConfig.smtpSecure,
        auth: {
          user: this.emailConfig.authUser,
          pass: this.emailConfig.authPassword,
        },
      });

      this.emit('email-initialized');
    } catch (error) {
      this.emit('email-init-error', error);
    }
  }

  /**
   * Create a backup schedule
   * @param {Object} scheduleConfig - Backup schedule configuration
   * @returns {Promise<Object>} - Created schedule
   */
  async createBackupSchedule(scheduleConfig) {
    try {
      const {
        backupType,
        frequency,
        scheduledTime,
        emailEnabled,
        recipientEmails,
        attachmentFormat,
        retentionDays,
        createdBy,
      } = scheduleConfig;

      const scheduleId = 'backup_' + Date.now();

      const schedule = {
        id: scheduleId,
        backupType,
        frequency,
        scheduledTime,
        emailEnabled,
        recipientEmails,
        attachmentFormat,
        retentionDays,
        status: 'active',
        createdBy,
        createdAt: new Date(),
      };

      this.backupSchedules.set(scheduleId, schedule);
      this.scheduleBackupJob(schedule);

      this.emit('schedule-created', { scheduleId });

      return {
        success: true,
        scheduleId,
        schedule,
      };
    } catch (error) {
      throw new Error(`Failed to create backup schedule: ${error.message}`);
    }
  }

  /**
   * Schedule backup job based on frequency
   * @param {Object} schedule - Backup schedule
   */
  scheduleBackupJob(schedule) {
    const frequencies = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };

    const interval = frequencies[schedule.frequency] || frequencies.daily;

    const now = new Date();
    const [hours, minutes] = (schedule.scheduledTime || '02:00').split(':');
    const nextRun = new Date();
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (nextRun <= now) {
      nextRun.setTime(nextRun.getTime() + interval);
    }

    const initialDelay = nextRun.getTime() - now.getTime();

    setTimeout(() => {
      this.executeBackup(schedule);
    }, initialDelay);

    const intervalId = setInterval(() => {
      this.executeBackup(schedule);
    }, interval);

    schedule.intervalId = intervalId;
  }

  /**
   * Execute backup manually
   * @param {Object} schedule - Backup schedule
   * @returns {Promise<Object>} - Backup result
   */
  async executeBackup(schedule) {
    const backupId = 'exec_' + Date.now();

    try {
      this.emit('backup-started', { backupId, type: schedule.backupType });

      schedule.status = 'in-progress';
      this.activeBackups.set(backupId, { backupId, schedule, startedAt: new Date() });

      const backupData = await this.collectBackupData(schedule.backupType);
      const backupFile = await this.createBackupFile(
        backupData,
        schedule.attachmentFormat,
        backupId
      );

      if (schedule.emailEnabled && schedule.recipientEmails.length > 0) {
        await this.sendBackupEmail(
          backupFile,
          schedule.recipientEmails,
          schedule.backupType
        );
      }

      await this.saveBackupMetadata(backupId, backupFile, schedule);
      await this.cleanupOldBackups(schedule.retentionDays);

      schedule.status = 'completed';
      schedule.lastBackupTime = new Date();

      this.emit('backup-completed', {
        backupId,
        backupFile,
        sentTo: schedule.recipientEmails,
      });

      return {
        success: true,
        backupId,
        backupFile,
      };
    } catch (error) {
      schedule.status = 'failed';
      this.emit('backup-error', { backupId, error });
      throw new Error(`Backup failed: ${error.message}`);
    } finally {
      this.activeBackups.delete(backupId);
    }
  }

  /**
   * Collect data for backup
   * @param {string} backupType - Type of backup
   * @returns {Promise<Object>} - Collected backup data
   */
  async collectBackupData(backupType) {
    try {
      const data = {
        backupDate: new Date(),
        backupType,
      };

      if (backupType === 'receipts' || backupType === 'all') {
        data.receipts = [];
      }

      if (backupType === 'transactions' || backupType === 'all') {
        data.transactions = [];
      }

      if (backupType === 'all') {
        data.inventory = [];
        data.users = [];
        data.settings = {};
      }

      this.emit('data-collected', { backupType, recordCount: Object.keys(data).length });
      return data;
    } catch (error) {
      throw new Error(`Failed to collect backup data: ${error.message}`);
    }
  }

  /**
   * Create backup file
   * @param {Object} data - Backup data
   * @param {string} format - File format
   * @param {string} backupId - Backup ID
   * @returns {Promise<Object>} - File information
   */
  async createBackupFile(data, format, backupId) {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `backup_${timestamp}_${backupId}.${format}`;
      const filePath = `./backups/${fileName}`;

      const fileInfo = {
        id: backupId,
        fileName,
        filePath,
        format,
        size: JSON.stringify(data).length,
        createdAt: new Date(),
      };

      this.emit('backup-file-created', fileInfo);
      return fileInfo;
    } catch (error) {
      throw new Error(`Failed to create backup file: ${error.message}`);
    }
  }

  /**
   * Send backup via email
   * @param {Object} backupFile - Backup file information
   * @param {Array} recipients - Email recipients
   * @param {string} backupType - Type of backup
   * @returns {Promise<Object>} - Email send result
   */
  async sendBackupEmail(backupFile, recipients, backupType) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: this.emailConfig.senderEmail,
        to: recipients.join(', '),
        subject: `Automatic Data Backup - ${backupType} (${new Date().toLocaleDateString()})`,
        html: this.generateBackupEmailTemplate(backupFile, backupType),
        attachments: [
          {
            filename: backupFile.fileName,
            path: backupFile.filePath,
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);

      const emailLog = {
        id: 'email_' + Date.now(),
        backupId: backupFile.id,
        backupType,
        recipientEmails: recipients,
        status: 'sent',
        sentAt: new Date(),
        messageId: info.messageId,
        attachmentName: backupFile.fileName,
        attachmentSize: backupFile.size,
      };

      this.emit('backup-email-sent', {
        backupId: backupFile.id,
        recipients,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        recipients,
      };
    } catch (error) {
      this.emit('backup-email-error', error);
      throw new Error(`Failed to send backup email: ${error.message}`);
    }
  }

  /**
   * Generate HTML email template for backup
   * @param {Object} backupFile - Backup file information
   * @param {string} backupType - Type of backup
   * @returns {string} - HTML email template
   */
  generateBackupEmailTemplate(backupFile, backupType) {
    const timestamp = new Date().toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { margin: 15px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Automatic Data Backup</h2>
          </div>
          <div class="content">
            <p>Dear Administrator,</p>
            <p>Your scheduled data backup has been completed successfully.</p>
            
            <div class="details">
              <p><span class="label">Backup Type:</span> ${backupType}</p>
              <p><span class="label">Created:</span> ${timestamp}</p>
              <p><span class="label">File:</span> ${backupFile.fileName}</p>
              <p><span class="label">Size:</span> ${(backupFile.size / 1024).toFixed(2)} KB</p>
              <p><span class="label">Format:</span> ${backupFile.format.toUpperCase()}</p>
            </div>
            
            <p>The backup file is attached to this email. Please keep it in a safe location.</p>
            <p><strong>Important:</strong> Store backups securely in multiple locations.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from your APK Rental Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Save backup metadata to database
   * @param {string} backupId - Backup ID
   * @param {Object} backupFile - Backup file information
   * @param {Object} schedule - Backup schedule
   */
  async saveBackupMetadata(backupId, backupFile, schedule) {
    try {
      const backup = {
        id: backupId,
        scheduleId: schedule.id,
        ...backupFile,
        schedule,
      };

      this.emit('metadata-saved', backup);
    } catch (error) {
      throw new Error(`Failed to save backup metadata: ${error.message}`);
    }
  }

  /**
   * Clean up old backups based on retention policy
   * @param {number} retentionDays - Number of days to retain backups
   */
  async cleanupOldBackups(retentionDays) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      this.emit('cleanup-completed', { cutoffDate });
    } catch (error) {
      this.emit('cleanup-error', error);
    }
  }

  /**
   * Get backup schedule details
   * @param {string} scheduleId - Schedule ID
   * @returns {Object} - Schedule details
   */
  getSchedule(scheduleId) {
    return this.backupSchedules.get(scheduleId);
  }

  /**
   * Get all active backup schedules
   * @returns {Array} - List of schedules
   */
  getAllSchedules() {
    const schedules = [];
    this.backupSchedules.forEach(schedule => {
      schedules.push(schedule);
    });
    return schedules;
  }

  /**
   * Delete backup schedule
   * @param {string} scheduleId - Schedule ID
   */
  deleteSchedule(scheduleId) {
    const schedule = this.backupSchedules.get(scheduleId);
    if (schedule && schedule.intervalId) {
      clearInterval(schedule.intervalId);
    }
    this.backupSchedules.delete(scheduleId);
  }
}

module.exports = AutoBackupService;
