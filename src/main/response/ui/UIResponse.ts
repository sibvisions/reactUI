import { BaseResponse } from ".";
import BaseComponent from "../util/types/BaseComponent";

interface UIResponse extends BaseResponse {
    changedComponents: Array<BaseComponent>
}
export default UIResponse;