/** Other imports */
import { BaseResponse } from ".";
import BaseComponent from "../components/BaseComponent";

/** Interface for ContentResponse */
interface ContentResponse extends BaseResponse {
    changedComponents: Array<BaseComponent>,
    update: boolean,
}
export default ContentResponse