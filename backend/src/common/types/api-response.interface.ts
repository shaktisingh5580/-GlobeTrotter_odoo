export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ApiResponseMeta {
  request_id: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, any> | Array<any>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}
