import { LoginModeType } from "../../response";
import { BaseRequest } from "..";

/** Interface for LoginRequest */
interface LoginRequest extends BaseRequest {
    username: string | undefined,
    password: string | undefined,
    newPassword: string | undefined,
    mode:LoginModeType | undefined,
    createAuthKey: boolean,
    confirmationCode: string | undefined
}
export default LoginRequest;