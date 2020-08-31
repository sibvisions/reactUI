import BaseResponse from "./BaseResponse";

type serverMenuButtons = {
    group: string,
    image: string,
    action: {
        componentId: string,
        label: string
    }
}
interface MenuResponse extends BaseResponse{
    componentId: string,
    items: Array<serverMenuButtons>
}
export default MenuResponse