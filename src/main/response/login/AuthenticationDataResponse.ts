/** Other imports */
import { BaseResponse } from "..";

/** Interface for AuthenticationDataResponse */
interface AuthenticationDataResponse extends BaseResponse{
    authKey: string;
}
export default AuthenticationDataResponse;