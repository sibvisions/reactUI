/** React imports */
import React, {FC, useContext} from "react";

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";

/** Other imports */
import {IPanel} from "../panel/UIPanel";
import {LayoutContext} from "../../../LayoutContext";
import Layout from "../../layouts/Layout";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/SendOnLoadCallback";
import {parsePrefSize, parseMinSize, parseMaxSize} from "../../util/parseSizes";

/**
 * This component displays a panel in which you will be able to scroll
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIScrollPanel: FC<IPanel> = (baseProps) => {
    /** Use context for the positioning, size informations of the layout */
    const layoutContext = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /**
     * Returns the style of the panel/layout
     * @returns style of panel/layout
     */
    const getStyle = () => {
        let s:React.CSSProperties;
        /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
        if (props.screen_modal_ && prefSize)
            s = {...layoutContext.get(id), height: prefSize.height, width: prefSize.width};
        /** If no prefsize is set but it is a popup, set size to undefined, don't use provided layoutContext style */
        else if (props.screen_modal_)
            s = {...layoutContext.get(id), height: undefined, width: undefined}
        /** Use provided layoutContext style*/
        else
            s = {...layoutContext.get(id) || {}}
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        /** Tell layout that because of the scrollbars it is ~20px smaller */
        (s.width as number) -= 20;
        (s.height as number) -= 20;
        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Size = {height: height+20, width: width+20};
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div id={props.id} style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width, overflow: 'auto'} : {...layoutContext.get(baseProps.id), overflow: 'auto'}}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                reportSize={reportSize}
                compSizes={componentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}

export default UIScrollPanel