/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for AuthenticationDataResponse */
interface AuthenticationDataResponse extends BaseResponse{
    authKey: string;
}
export default AuthenticationDataResponse;