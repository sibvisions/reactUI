import BaseResponse from "./BaseResponse";

interface UserDataResponse extends BaseResponse{
    displayName: string,
    email: string,
    profileImage: string,
}
export default UserDataResponse