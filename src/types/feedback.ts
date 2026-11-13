export type FeedbackCategory = 'BUG' | 'IDEA' | 'ECO_ACTION' | 'ACCESSIBILITY' | 'OTHER';

export type FeedbackStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface FeedbackSubmission {
  id: string;
  userEmail?: string;
  category: FeedbackCategory;
  rating?: number | null;
  subject: string;
  message: string;
  hasScreenshot: boolean;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackCreatePayload {
  category: FeedbackCategory;
  rating?: number | null;
  subject: string;
  message: string;
  screenshot?: File | null;
}

export interface PaginatedFeedback {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedbackSubmission[];
}
