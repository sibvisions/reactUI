/** Other imports */
import { MessageResponse } from "..";

/** Interface for ErrorResponse */
interface ErrorResponse extends MessageResponse {
    details?: string,
    silentAbort?: boolean
    exceptions?: { message:string, exception:string }[]
}
export default ErrorResponse