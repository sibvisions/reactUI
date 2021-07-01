import { LoginModeType } from "../response";

/** Interface for LoginRequest */
interface LoginRequest {
    clientId: string | undefined,
    username: string | undefined,
    password: string | undefined,
    newPassword: string | undefined,
    mode:LoginModeType | undefined,
    createAuthKey: boolean
}
export default LoginRequest;