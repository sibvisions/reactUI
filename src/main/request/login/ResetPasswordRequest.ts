import { BaseRequest } from "..";

interface ResetPasswordRequest extends BaseRequest {
    identifier?: string
}
export default ResetPasswordRequest