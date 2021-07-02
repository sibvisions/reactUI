/** Other imports */
import { BaseResponse } from ".";

/** Interface for ApplicationMetaDataResponse */
interface ApplicationMetaDataResponse extends BaseResponse {
    version: string
    clientId: string
    langCode: string
    languageResource: string
    lostPasswordEnabled: boolean
}
export default ApplicationMetaDataResponse;