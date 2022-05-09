/** Other imports */
import { BaseResponse } from "..";

export type LoginModeType = "manual"|"changePassword"|"changeOneTimePassword"|"automatic"|"lostPassword"|"mFTextInput"|"mFWait"|"mFURL"|undefined

export type MFAURLType = {
    target?: "_self" | "_blank",
    url: string
    height?: number,
    width?: number,
}

/** Interface for LoginResponse */
interface LoginResponse extends BaseResponse {
    username: string;
    mode: LoginModeType;
    confirmationCode?: string;
    link?:string | MFAURLType;
    timeout?:number;
    errorMessage?: string
}
export default LoginResponse;