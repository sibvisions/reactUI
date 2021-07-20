/** React imports */
import React, { FC, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */

import { IPanel } from "..";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension } from "../../util";

/**
 * This component displays a panel in which you will be able to scroll
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIScrollPanel: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);
    const panelRef = useRef<any>(null)
    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /**
     * Returns the style of the panel/layout
     * @returns style of panel/layout
     */
    const getStyle = () => {
        let s:React.CSSProperties;
        /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
        if (props.screen_modal_ && prefSize)
            s = {...layoutStyle, height: prefSize.height, width: prefSize.width};
        /** If no prefsize is set but it is a popup, set size to undefined, don't use provided layoutContext style */
        else if (props.screen_modal_)
            s = {...layoutStyle, height: undefined, width: undefined}
        /** Use provided layoutContext style*/
        else
            s = {...layoutStyle}
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }

        /** Tell layout that because of the scrollbars it is ~20px smaller */
        // if(s.width !== undefined) {
        //     (s.width as number) -= 20;
        // }
        // if(s.height !== undefined) {
        //     (s.height as number) -= 20;
        // }

        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Dimension = {height: height+20, width: width+20};
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div 
            ref={panelRef}
            id={props.name} 
            style={props.screen_modal_ 
                ? { 
                    height: (prefSize?.height as number), 
                    width: prefSize?.width, 
                    overflow: 'auto'
                } 
                : {
                    ...layoutStyle, 
                    overflow: 'auto'
                }
            }
        >
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                reportSize={reportSize}
                compSizes={componentSizes}
                components={components}
                alignChildrenIfOverflow={false}
                style={getStyle()}/>
        </div>
    )
}

export default UIScrollPanel