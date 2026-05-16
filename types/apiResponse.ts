export type ApiResponse<T> =
  | {
      isSuccess: true;
      data: T;
      message: string;
      errorCode: number;
    }
  | {
      isSuccess: false;
      data: null;
      message: string;
      errorCode: number;
    };
