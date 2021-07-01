import { BaseRequest } from ".";

/** Interface for PressButtonRequest */
interface PressButtonRequest extends BaseRequest{
    componentId: string | undefined
}
export default PressButtonRequest