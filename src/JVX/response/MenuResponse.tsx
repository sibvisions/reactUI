import BaseResponse from "./BaseResponse";

export type serverMenuButtons = {
    componentId: string,
    group: string,
    text: string,
    image: string,
    action: Function,
}
interface MenuResponse extends BaseResponse{
    componentId: string,
    entries: Array<serverMenuButtons>
}
export default MenuResponse