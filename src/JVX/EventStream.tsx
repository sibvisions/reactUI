import {Subject} from "rxjs";

export type layoutInfo = {
    id: string
    width: number,
    height: number,
    left: number,
    top: number,
    position?: "absolute" | "relative" | undefined;
}

class EventStream{
    styleEvent = new Subject<layoutInfo>();
    resizeEvent = new Subject<Map<string, {width: number, height: number}>>();
}
export default EventStream