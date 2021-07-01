/** Other imports */
import { BaseResponse } from ".";

export type LoginModeType = "manual"|"changePassword"|"changeOneTimePassword"|"automatic"|"lostPassword"|undefined

/** Interface for LoginResponse */
interface LoginResponse extends BaseResponse {
    username: string;
    mode: LoginModeType;
}
export default LoginResponse;