import { BaseResponse } from ".";

/** Interface for ApplicationSettingsResponse */
interface ApplicationSettingsResponse extends BaseResponse {
    reload:boolean,
    rollback:boolean,
    save:boolean,
    changePassword:boolean,
    menuBar:boolean,
    toolBar:boolean
}
export default ApplicationSettingsResponse;