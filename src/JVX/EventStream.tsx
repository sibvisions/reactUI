import {Subject} from "rxjs";

export type layoutInfo = {
    id: string
    width: number,
    height: number,
    left: number,
    top: number,
    position?: "absolute" | "relative" | undefined;
}

type resize = {
    id: string,
    width: number
}

class EventStream{
    styleEvent = new Subject<layoutInfo>();
    resizeEvent = new Subject<resize>();
}
export default EventStream