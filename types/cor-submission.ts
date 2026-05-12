export type CreateCorSubmissionRequest = {
  userId: string;
  academicTerm: string; // admin-controlled globally
  corDocumentUrl: string;
};

export type CreateCorSubmissionResponse = {
  submissionId: string;
  userId: string;
  academicTerm: string;
  corDocumentUrl: string;
  createdAt?: string;
};
