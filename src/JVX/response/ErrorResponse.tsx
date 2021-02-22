/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for ErrorResponse */
interface ErrorResponse extends BaseResponse {
    details?: string,
    title?: string,
    message?: string
}
export default ErrorResponse