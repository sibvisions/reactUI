/** React imports */
import React, {CSSProperties, FC, useContext} from "react";
import { useParams } from "react-router";
import { appContext } from "../../main/AppProvider";
import { getScreenIdFromNavigation } from "../../main/components/util";

/** Hook imports */
import { useHomeComponents } from "../../main/components/zhooks";

/**Other imports */
import { IForwardRef } from "../../main/IForwardRef";
import { DesktopPanelHandler } from "../login/login";

interface IWorkScreen extends IForwardRef {
    style?: CSSProperties
}

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC<IWorkScreen> = ({forwardedRef, style}) => {
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Screens which are currently displayed by the workscreen can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);

    return (
        <div id="workscreen" ref={forwardedRef} style={{flex: '1', ...style}}>
            {getScreenIdFromNavigation(componentId, context.contentStore) ? 
            homeChildren : <DesktopPanelHandler />}
        </div>
    )
}
export default WorkScreen