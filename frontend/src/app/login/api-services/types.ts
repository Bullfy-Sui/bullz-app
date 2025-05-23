export interface AuthRequest {
  address: string;
  // google_id: string;
}

export interface RegistrationResponse {
  data: {
    address: string;
    balance: number;
    // google_id: string;
  };
  message: string;
  status: number;
}
