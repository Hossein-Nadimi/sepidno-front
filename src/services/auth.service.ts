import api from "@/lib/api";
import type {
  OtpSendResponse,
  VerifyOtpResponse,
  User,
  SuccessResponse,
} from "@/types";

export const authService = {
  sendOtp(phoneNumber: string): Promise<OtpSendResponse> {
    return api.post<SuccessResponse<OtpSendResponse>>("/auth/otp/send", { phoneNumber }).then((r) => r.data.data);
  },
  verifyOtp(phoneNumber: string, code: string): Promise<VerifyOtpResponse> {
    return api
      .post<SuccessResponse<VerifyOtpResponse>>("/auth/otp/verify", { phoneNumber, code })
      .then((r) => r.data.data);
  },
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return api
      .post<SuccessResponse<{ accessToken: string; refreshToken: string }>>("/auth/refresh", { refreshToken })
      .then((r) => r.data.data);
  },
  me(): Promise<User> {
    return api.get<SuccessResponse<User>>("/auth/me").then((r) => r.data.data);
  },
  logout(refreshToken: string): Promise<void> {
    return api.post("/auth/logout", { refreshToken }).then(() => undefined);
  },
};
