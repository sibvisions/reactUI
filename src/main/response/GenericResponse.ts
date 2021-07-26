/** Other imports */
import { BaseResponse } from ".";
import BaseComponent from "../components/BaseComponent";

/** Interface for GenericResponse */
interface GenericResponse extends BaseResponse {
    componentId: string,
    changedComponents: Array<BaseComponent>,
    update: boolean,
    home: boolean
}
export default GenericResponse