import React, { FC } from "react";
import { Layout } from "../layouts";
import { concatClassnames, Dimension } from "../../util";
import { useComponents } from "../../hooks";

/**
 * This component displays a menubar for a frame
 * @param baseProps - the base properties received from the frame
 */
const UIToolbar: FC<any> = (props) => {

    const [, components, componentSizes] = useComponents(props.id, props.className);

    const reportSize = (size:Dimension) => {
        props.sizeCallback({ height: size.height + 1, width: size.width });
    };

    return (
        <div id={props.name} className={concatClassnames("rc-frame-toolbar", props.style)}>
            <Layout
                id={props.id}
                className="Frame-Toolbar"
                layoutData={""}
                layout="FlowLayout,0,0,0,0,0,0,0,0,0,3,true"
                compSizes={componentSizes}
                components={components}
                style={{}}
                reportSize={reportSize}
                parent={props.id.substring(0, props.id.indexOf("-"))}
                panelType="Frame-Toolbar" />
        </div>
    )
}
export default UIToolbar