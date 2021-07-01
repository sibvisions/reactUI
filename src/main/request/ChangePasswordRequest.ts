import { BaseRequest } from ".";

/** Interface for ChangePasswordRequest */
interface ChangePasswordRequest extends BaseRequest {
    password?: string,
    newPassword?: string
}
export default ChangePasswordRequest