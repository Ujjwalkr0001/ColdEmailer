export interface ValidationResponse {
  total: number;
  valid: string[];
  invalid: string[];
  duplicates: string[];
}