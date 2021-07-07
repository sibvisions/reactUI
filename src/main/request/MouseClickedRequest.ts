import { MouseRequest } from ".";

/** Interface for MouseClickedRequest extends MouseRequest */
interface MouseClickedRequest extends MouseRequest {
    clickCount?: number
}
export default MouseClickedRequest;