import BaseResponse from "./BaseResponse";

interface ErrorResponse extends BaseResponse {
    details?: string,
    title?: string,
    message?: string
}
export default ErrorResponse