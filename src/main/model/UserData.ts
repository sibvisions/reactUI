/** Other imports */
import { UserDataResponse } from "../response";

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

    /** Username of the user */
    userName:string;

    /** Roles of the user */
    roles:string[];

    /**
     * @constructor constructs a new user
     * @param newUser - the user data
     */
    constructor(newUser?: UserDataResponse) {
        this.displayName = newUser?.displayName || "";
        this.email = newUser?.email || "";
        this.name = newUser?.name || "";
        this.profileImage = newUser?.profileImage;
        this.userName = newUser?.userName || "";
        this.roles = newUser?.roles || [];
    }

}
export default UserData