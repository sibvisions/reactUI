import { ComponentRequest } from "..";

/** Interface for MouseRequest */
interface MouseRequest extends ComponentRequest {
    button?: "Left"|"Middle"|"Right",
    x?: number,
    y?: number
}
export default MouseRequest;