import { BaseResponse } from "..";
import BaseComponent from "../../util/types/BaseComponent";

/** Interface for ApplicationSettingsResponse */
interface ApplicationSettingsResponse extends BaseResponse {
    reload?:boolean,
    rollback?:boolean,
    save?:boolean,
    changePassword?:boolean,
    menuBar?:boolean,
    toolBar?:boolean,
    home?:boolean,
    logout?:boolean,
    userSettings?:boolean,
    restart?:boolean
    desktop?: Array<BaseComponent>
}
export default ApplicationSettingsResponse;