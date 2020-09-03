import BaseResponse from "./BaseResponse";

interface AuthenticationDataResponse extends BaseResponse{
    authKey: string;
}
export default AuthenticationDataResponse;