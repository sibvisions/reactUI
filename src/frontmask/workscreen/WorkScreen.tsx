/** React imports */
import React, {CSSProperties, FC} from "react";
import { useParams } from "react-router";

/** Hook imports */
import { useHomeComponents } from "../../main/components/zhooks";

/**Other imports */
import { IForwardRef } from "../../main/IForwardRef";


interface IWorkScreen extends IForwardRef {
    style?: CSSProperties
}

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC<IWorkScreen> = ({forwardedRef, style}) => {
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the workscreen can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);

    return (
        <div id="workscreen" ref={forwardedRef} style={{flex: '1', ...style}}>
            {homeChildren}
        </div>
    )
}
export default WorkScreen