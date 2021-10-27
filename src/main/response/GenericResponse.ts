/** Other imports */
import { ComponentResponse } from ".";
import BaseComponent from "../components/BaseComponent";

/** Interface for GenericResponse */
interface GenericResponse extends ComponentResponse {
    changedComponents: Array<BaseComponent>,
    update: boolean,
    home: boolean
}
export default GenericResponse