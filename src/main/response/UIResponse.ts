import { BaseResponse } from ".";
import BaseComponent from "../components/BaseComponent";

interface UIResponse extends BaseResponse {
    changedComponents: Array<BaseComponent>
}
export default UIResponse;