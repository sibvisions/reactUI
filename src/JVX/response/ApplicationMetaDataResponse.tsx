/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for ApplicationMetaDataResponse */
interface ApplicationMetaDataResponse extends BaseResponse {
    version: string
    clientId: string
    langCode: string
    languageResource: string
}
export default ApplicationMetaDataResponse;