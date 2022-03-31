/** Other imports */
import { MessageResponse } from "..";

/** Interface for ErrorResponse */
interface ErrorResponse extends MessageResponse {
    details?: string,
    silentAbort?: boolean
}
export default ErrorResponse