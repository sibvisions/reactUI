/** React imports */
import React, { CSSProperties, FC, useContext, useEffect, useMemo, useRef, useState } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */

import { IPanel } from "..";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension } from "../../util";
import { appContext } from "../../../AppProvider";

/**
 * This component displays a panel in which you will be able to scroll
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIScrollPanel: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);
    const panelRef = useRef<any>(null);
    const minusWidth = useRef<boolean>(false);
    const minusHeight = useRef<boolean>(false);
    const [layoutSize, setLayoutSize] = useState<Dimension>()
    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const scrollStyle = useMemo(() => {
        let s:React.CSSProperties = {};
        /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
        if (props.screen_modal_) {
            const screenSize = parsePrefSize(props.screen_size_);
            if (screenSize) {
                s = { ...layoutStyle, height: screenSize.height, width: screenSize.width }
            }
            else if (prefSize) {
                s = { ...layoutStyle, height: prefSize.height, width: prefSize.width };
            }
        }
        else {
            s = {...layoutStyle}
        }
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        let foundHigher = false;
        let foundWider = false
        componentSizes?.forEach((size) => {
            if (s.height !== undefined && (s.height as number) < size.preferredSize.height) {
                foundHigher = true
            }
            if (s.width !== undefined && (s.width as number) < size.preferredSize.width) {
                foundWider = true
            }
        });

        if (s.height !== undefined && layoutSize && (s.height as number) < layoutSize.height) {
            foundHigher = true
        }
        if (s.width !== undefined && layoutSize && (s.width as number) < layoutSize.width) {
            foundWider = true
        }

        if (foundHigher) {
            (s.width as number) -= 17;
            minusWidth.current = true;
        }
        else {
            minusWidth.current = false;
        }

        if (foundWider) {
            (s.height as number) -= 17;
            minusHeight.current = true;
        }
        else {
            minusHeight.current = false;
        }

        return s;

    }, [componentSizes, layoutStyle?.width, layoutStyle?.height, props.screen_modal_, layoutSize])

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Dimension = {height: height + (minusHeight.current ? 17 : 0), width: width + (minusWidth.current ? 17 : 0)};
            if (layoutSize?.height !== prefSize.height || layoutSize.width !== prefSize.width) {
                setLayoutSize({height: prefSize.height, width: prefSize.width})
            }
            sendOnLoadCallback(id, props.preferredSize ? parsePrefSize(props.preferredSize) : prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div 
            ref={panelRef}
            id={props.name}
            className="rc-scrollpanel" 
            style={props.screen_modal_ 
                ? { 
                    height: (prefSize?.height as number), 
                    width: prefSize?.width, 
                    overflow: 'auto',
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
                } 
                : {
                    ...layoutStyle, 
                    overflow: 'auto',
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
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
                popupSize={parsePrefSize(props.screen_size_)}
                reportSize={reportSize}
                compSizes={componentSizes}
                components={components}
                alignChildrenIfOverflow={false}
                style={scrollStyle}/>
        </div>
    )
}

export default UIScrollPanel