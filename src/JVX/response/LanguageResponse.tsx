/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for LanguageResponse */
interface LanguageResponse extends BaseResponse {
    langCode: string,
    languageResource: string
}
export default LanguageResponse;