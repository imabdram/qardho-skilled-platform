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
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export interface Job {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  location: string;    // Neighborhood in Qardho
  description: string;
  rate: string;        // Payment offer (e.g. "$20/day")
  phone: string;       // Direct contact phone
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  completionRequestedAt?: string;
  workerCompletedAt?: string;
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
