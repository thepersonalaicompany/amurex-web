// Define types for the request body and potential error response
export interface GenerateRequest {
  prompt: string;
}

export interface ErrorResponse {
  error: string;
}
