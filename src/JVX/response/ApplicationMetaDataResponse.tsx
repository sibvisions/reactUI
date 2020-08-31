import BaseResponse from "./BaseResponse";

interface ApplicationMetaDataResponse extends BaseResponse {
    version: string
    clientId: string
    langCode: string
    languageResource: string
}
export default ApplicationMetaDataResponse;