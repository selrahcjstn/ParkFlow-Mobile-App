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

export interface UserRatingDto {
  rating: number | null;
  ratedAt: string | null;
  hasRated: boolean;
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

  getMyRating: async () => {
    return await apiRequest<UserRatingDto>(
      "get",
      "/feedbacks/my-rating"
    );
  },

  updateRating: async (rating: number) => {
    return await apiRequest<UserRatingDto, { rating: number }>(
      "put",
      "/feedbacks/my-rating",
      { rating }
    );
  },
};
