import {Subject} from "rxjs";

export type layoutInfo = {
    id: string
    width?: string,
    height?: string,
    left?: number,
    top?: number,
    position?: "absolute" | undefined;
}

class EventStream{
    styleEvent = new Subject<layoutInfo>();
}
export default EventStream