import BaseResponse from "./BaseResponse";
import BaseComponent from "../components/BaseComponent";

interface GenericResponse extends BaseResponse{
    componentId: string,
    changedComponents: Array<BaseComponent>,
    update: boolean
}
export default GenericResponse