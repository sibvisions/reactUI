import BaseComponent from "../types/BaseComponent";
import COMPONENT_CLASSNAMES from "../../components/COMPONENT_CLASSNAMES";
import { ITextField } from "../../components/text/UIText";

/**
 * Returns true, if the component is disabled
 * @param props - the properties of the component
 */
export function isCompDisabled(props:BaseComponent) {
    if([COMPONENT_CLASSNAMES.TEXTFIELD, COMPONENT_CLASSNAMES.TEXTAREA, COMPONENT_CLASSNAMES.PASSWORD].indexOf(props.className as COMPONENT_CLASSNAMES) !== -1) {
        const castedProps = {...props} as ITextField
        return castedProps.enabled === false || castedProps.editable === false;
    }
    else {
        return props.enabled === false
    }
}