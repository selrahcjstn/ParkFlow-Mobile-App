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
  
  // Admin Reply & Invoice Fields
  adminReplyMessage?: string | null;
  adminRepliedAt?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  invoiceDescription?: string | null;
  invoiceStatus?: string | null;

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

  getMyFeedbacks: async () => {
    return await apiRequest<FeedbackDto[]>(
      "get",
      "/feedbacks/my-feedbacks"
    );
  },
};
