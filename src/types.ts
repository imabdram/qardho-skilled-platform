/**
 * Qardho Skilled Platform
 * Shared TypeScript Definitions
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role?: 'worker' | 'employer' | 'admin' | 'pending';
  skill?: string;      // Required for workers (e.g. "Electrician", "Plumber")
  location?: string;   // Qardho neighborhoods (e.g. "Kaambo", "Qoryacad", "Xorgoble")
  bio?: string;
  rate?: string;       // Expected rate for workers (e.g. "$15/day")
  createdAt?: string;
  smsNotificationsEnabled?: boolean;
  availability?: 'available' | 'busy' | 'unavailable';
  verified?: boolean;
  suspended?: boolean;
  whatsappPhone?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  pricingType?: PricingType;
  pricingAmount?: number;
  pricingCurrency?: string;
  pricingNote?: string;
}

export const PROFILE_FIELD_KEYS = [
  'name',
  'phone',
  'email',
  'role',
  'location',
  'bio',
  'skill',
  'rate',
  'availability',
] as const;

export type ProfileFieldKey = typeof PROFILE_FIELD_KEYS[number];

export interface VerificationMessage {
  userId: string;
  adminId: string;
  adminName: string;
  missingFields: ProfileFieldKey[];
  note?: string;
  sentAt: string;
  readAt?: string;
}
export type PricingType = 'project' | 'hour' | 'day';
export type JobStatus = 'open' | 'active' | 'completion_requested_by_worker' | 'completion_requested_by_employer' | 'completed' | 'completion_disputed' | 'cancelled' | 'closed' | 'in_progress';

export interface Job {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  location: string;    // Neighborhood in Qardho
  description: string;
  requirements?: string;
  category?: string;
  workType?: string;
  expectedDuration?: string;
  rate: string;        // Payment offer (e.g. "$20/day")
  phone?: string;
  pricingType?: PricingType;
  pricingAmount?: number;
  pricingCurrency?: string;
  pricingNote?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  completionRequestedAt?: string;
  workerCompletedAt?: string;
  completionRequestedBy?: string;
  completionRequestedRole?: 'worker' | 'employer';
  completionConfirmedBy?: string;
  completionConfirmedAt?: string;
  completionDisputedBy?: string;
  completionDisputedAt?: string;
  status: JobStatus;   // Lifecycle status for the job post
  createdAt: string;
}

export interface Connection {
  id: string;
  fromUserId: string;  // Usually employer initiating contact
  fromUserName: string;
  toUserId: string;    // Worker being contacted
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  phone?: string;      // Contact info shared
  jobId?: string;
  jobTitle?: string;
  expectedTimeline?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  readAt?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  applicantId: string; // Worker applying
  applicantName: string;
  applicantSkill: string;
  message: string;
  phone: string;       // Contact phone
  location: string;    // Worker's location
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  proposedPricingType?: PricingType;
  proposedAmount?: number;
  proposedCurrency?: string;
  proposedNote?: string;
  expectedTimeline?: string;
}

export interface Review {
  id: string;
  workerId: string;
  employerId: string;
  employerName: string;
  jobId?: string;
  jobTitle?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

