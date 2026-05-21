export type ApiResponse<T> =
  | {
      isSuccess: true;
      data: T;
      result?: T;
      message: string;
      errorCode: number;
    }
  | {
      isSuccess: false;
      // data may carry a conflict/error payload returned by the backend (e.g. 409 conflict)
      data: T | null;
      result?: T | null;
      message: string;
      errorCode: number;
    };

