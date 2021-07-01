/** Other imports */
import { BaseResponse } from ".";

/** Interface for UserDataResponse */
interface UserDataResponse extends BaseResponse{
    displayName: string,
    email: string,
    profileImage?: string,
    userName: string
}
export default UserDataResponse