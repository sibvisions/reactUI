import UserDataResponse from "../response/UserDataResponse";

class UserData implements UserDataResponse{
    displayName: string;
    email: string;
    name: string;
    profileImage?: string;

    constructor(newUser?: UserDataResponse) {
        this.displayName = newUser?.displayName || "";
        this.email = newUser?.email || "";
        this.name = newUser?.name || "";
        this.profileImage = newUser?.profileImage;
    }

}
export default UserData