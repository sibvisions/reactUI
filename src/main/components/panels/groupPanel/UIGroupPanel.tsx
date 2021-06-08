/** React imports */
import React, { FC, useContext } from "react";

/** Hook imports */
import { useProperties, useComponents } from "../../zhooks";

/** Other imports */
import { LayoutContext } from "../../../LayoutContext";
import { Layout } from "../../layouts";
import { IPanel } from "..";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback } from "../../util";

/**
 * This component is a panel with a header, useful to group components
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGroupPanel: FC<IPanel> = (baseProps) => {
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
        /** If GroupPanel is a popup and prefsize is set use it, not the height layoutContext provides */
        if (props.screen_modal_ && prefSize)
            s = {...layoutContext.get(id), height: prefSize.height, width: prefSize.width};
        /** If no prefsize is set but it is a popup, set size to undefined, don't use provided layoutContext style */
        else if (props.screen_modal_)
            s = {...layoutContext.get(id), height: undefined, width: undefined};
        /** Use provided layoutContext style*/
        else
            s = {...layoutContext.get(id) || {}}
        s.top = undefined;
        s.left = undefined;
        (s.width as number) -= 0;
        /** Tell layout that because of the header it is ~28px smaller */
        (s.height as number) -= 28;
        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Dimension = {height: height+28, width: width};
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div className="rc-panel-group" id={props.name} style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : {...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <div className="rc-panel-group-caption"><span>{props.text}</span></div>
            <Layout
                id={props.id}
                layoutData={props.layoutData}
                layout={props.layout}
                reportSize={reportSize}
                compSizes={componentSizes}
                components={components}
                style={{...getStyle()}}/>
        </div>

    )
}

export default UIGroupPanel