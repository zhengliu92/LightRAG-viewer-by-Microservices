export interface BaseResponse<T> {
  data?: T;
  code?: number;
  message?: string;
}
