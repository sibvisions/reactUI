/** Other imports */
import BaseResponse from "./BaseResponse";
import BaseComponent from "../components/BaseComponent";

/** Interface for GenericResponse */
interface GenericResponse extends BaseResponse {
    componentId: string,
    changedComponents: Array<BaseComponent>,
    update: boolean,
}
export default GenericResponse