/** Other imports */
import { MessageResponse } from ".";

/** Interface for ErrorResponse */
interface ErrorResponse extends MessageResponse {
    details?: string
}
export default ErrorResponse