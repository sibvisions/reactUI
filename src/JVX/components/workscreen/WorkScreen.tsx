/** React imports */
import React, {Children, CSSProperties, FC, ReactElement, useContext} from "react";
import { useParams } from "react-router";

/** Hook imports */
import useHomeComponents from "../zhooks/useHomeComponents";

/** Other imports */
import { jvxContext } from "../../jvxProvider";
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";


interface IWorkScreen {
    forwardedRef?: any,
    isGlobal?: boolean,
    isCustom?: boolean,
    style?: CSSProperties
}

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC<IWorkScreen> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the workscreen can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    const iterateChildren = (children:any) => {
        Children.forEach(children, child => {
            console.log(child)
            if (child.props.children) {
                iterateChildren(child.props.children);
            }
        })
    }

    console.log(props.isCustom, props.children, screenId)

    if (props.isGlobal) {
        return context.contentStore.customDisplays.get("global") as ReactElement
    }
    else {
        return (
            <div id="workscreen" ref={props.forwardedRef} style={{flex: '1', ...props.style}}>
                {homeChildren}
            </div>
        )
    }
}
export default WorkScreen