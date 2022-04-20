/** Other imports */
import { BaseResponse } from "..";

export type LoginModeType = "manual"|"changePassword"|"changeOneTimePassword"|"automatic"|"lostPassword"|"mFTextInput"|undefined

/** Interface for LoginResponse */
interface LoginResponse extends BaseResponse {
    username: string;
    mode: LoginModeType;
    confirmatinCode?: string
}
export default LoginResponse;