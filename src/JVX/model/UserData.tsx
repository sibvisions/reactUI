/** Other imports */
import UserDataResponse from "../response/UserDataResponse";

/**
 * Class for UserData
 */
class UserData implements UserDataResponse {
    /** The display name of the user which will be showed in the menu */
    displayName: string;
    /** Email of the user */
    email: string;
    /** Name of the user */
    name: string;
    /** Profileimage of the user */
    profileImage?: string;

    /**
     * @constructor constructs a new user
     * @param newUser - the user data
     */
    constructor(newUser?: UserDataResponse) {
        this.displayName = newUser?.displayName || "";
        this.email = newUser?.email || "";
        this.name = newUser?.name || "";
        this.profileImage = newUser?.profileImage;
    }

}
export default UserData