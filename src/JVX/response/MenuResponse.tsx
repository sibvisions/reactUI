import BaseResponse from "./BaseResponse";

type serverMenuButtons = {
    componentId: string,
    group: string,
    text: string,
    image: string,
}
interface MenuResponse extends BaseResponse{
    componentId: string,
    entries: Array<serverMenuButtons>
}
export default MenuResponse