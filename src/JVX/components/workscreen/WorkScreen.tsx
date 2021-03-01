/** React imports */
import React, {FC} from "react";
import { useParams } from "react-router";
import { IMenu } from "../../../frontmask/menu/menu";
import useHomeComponents from "../zhooks/useHomeComponents";

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC<IMenu> = (props) => {
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the workscreen can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);
    return (
        <div id="workscreen" ref={props.forwardedRef} style={{flex: "1 1 auto"}}>
            {homeChildren}
        </div>
    )
}
export default WorkScreen