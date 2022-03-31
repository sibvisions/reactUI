import { ComponentRequest } from "..";

/** Interface for MouseRequest */
interface BoundsRequest extends ComponentRequest {
    width?: number,
    height?: number
    x?: number,
    y?: number
}
export default BoundsRequest;