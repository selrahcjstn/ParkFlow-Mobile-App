import { apiRequest } from "@/services/common.service";

export interface FeedbackSubmissionPayload {
  category: string;
  rating: number;
  description: string;
  attachmentUrl?: string | null;
}

export interface FeedbackDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  category: string;
  rating: number;
  description: string;
  attachmentUrl?: string | null;
  status: number;
  statusName: string;
  adminNotes?: string | null;
  createdAt: string;
}

export const feedbackService = {
  submitFeedback: async (payload: FeedbackSubmissionPayload) => {
    return await apiRequest<FeedbackDto, FeedbackSubmissionPayload>(
      "post",
      "/feedbacks",
      payload
    );
  },
};
