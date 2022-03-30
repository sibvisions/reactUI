/** Other imports */
import { BaseResponse } from "..";

/** Interface for ErrorResponse */
interface MessageResponse extends BaseResponse {
    title?: string,
    message?: string
}
export default MessageResponse