import BaseComponent from "../BaseComponent";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { ITextField } from "../text/UIText";

/**
 * Returns true, if the component is disabled
 * @param props - the properties of the component
 */
export function isCompDisabled(props:BaseComponent) {
    if([COMPONENT_CLASSNAMES.TEXTFIELD, COMPONENT_CLASSNAMES.TEXTAREA, COMPONENT_CLASSNAMES.PASSWORD].indexOf(props.className as COMPONENT_CLASSNAMES)) {
        const castedProps = {...props} as ITextField
        return castedProps.enabled === false || castedProps.editable === false;
    }
    else {
        return props.enabled === false
    }
}