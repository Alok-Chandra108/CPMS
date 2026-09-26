const emailService = require('../services/email.service');
const emailQueue = require('../services/emailQueue.service');

jest.mock('../services/email.service', () => ({
  sendStatusUpdateEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
}));

describe('Email Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailQueue._memoryQueue.length = 0;
  });

  afterAll(() => {
    emailQueue.stopWorker();
  });

  it('should successfully enqueue a single status update email', async () => {
    const jobPayload = {
      fullName: 'Test Student',
      email: 'student@example.com',
      companyName: 'Acme Corp',
      jobRole: 'Software Engineer',
      status: 'shortlisted',
      remarks: 'Selected for round 2',
    };

    const result = await emailQueue.queueStatusUpdateEmail(jobPayload);
    expect(result).toBe(true);

    const stats = await emailQueue.getQueueStats();
    expect(stats.pending).toBeGreaterThanOrEqual(1);
  });

  it('should successfully enqueue bulk status update emails', async () => {
    const jobs = [
      {
        fullName: 'Student 1',
        email: 's1@example.com',
        companyName: 'Acme Corp',
        jobRole: 'Frontend Dev',
        status: 'shortlisted',
      },
      {
        fullName: 'Student 2',
        email: 's2@example.com',
        companyName: 'Acme Corp',
        jobRole: 'Frontend Dev',
        status: 'rejected',
      },
    ];

    const count = await emailQueue.queueBulkStatusUpdateEmails(jobs);
    expect(count).toBe(2);
  });

  it('should process jobs from the queue and call sendStatusUpdateEmail', async () => {
    const jobPayload = {
      fullName: 'John Doe',
      email: 'john@example.com',
      companyName: 'TechCorp',
      jobRole: 'Backend Engineer',
      status: 'selected',
      remarks: 'Congratulations!',
    };

    await emailQueue.queueStatusUpdateEmail(jobPayload);

    const processed = await emailQueue.processNextJob();
    expect(processed).toBe(true);
    expect(emailService.sendStatusUpdateEmail).toHaveBeenCalledWith(
      'John Doe',
      'john@example.com',
      'TechCorp',
      'Backend Engineer',
      'selected',
      'Congratulations!'
    );
  });

  it('should return false when attempting to process an empty queue', async () => {
    emailQueue._memoryQueue.length = 0;
    // Process when empty
    const processed = await emailQueue.processNextJob();
    expect(processed).toBe(false);
  });
});
