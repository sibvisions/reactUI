import { BaseResponse } from "..";

/** Interface for ApplicationMetaDataResponse */
interface ApplicationMetaDataResponse extends BaseResponse {
    version: string
    clientId: string
    langCode: string
    languageResource: string
    lostPasswordEnabled: boolean
    preserveOnReload: boolean
    applicationLayout: "standard"|"corporation" |"modern"
    applicationName: string
    applicationTheme: string
    applicationColorScheme: string
    applicationDesign?:string
    aliveInterval?: number
}
export default ApplicationMetaDataResponse;