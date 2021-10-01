/** React imports */
import React, { CSSProperties, FC, useContext, useEffect, useMemo, useRef, useState } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */

import { IPanel } from "..";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, panelReportSize } from "../../util";
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

    /** Children of this panel */
    const children = useMemo(() => context.contentStore.getChildren(props.id), [props.id]);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, children);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Refernce for the panel element */
    const panelRef = useRef<any>(null);

    /** Reference if a fixed amount of px (width) should be substracted if scrollbar appears */
    const minusWidth = useRef<boolean>(false);

    /** Reference if a fixed amount of px (height) should be substracted if scrollbar appears */
    const minusHeight = useRef<boolean>(false);

    /** State of layoutsize */
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
    const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "P", 
            prefSize, 
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback,
            minusHeight.current,
            minusWidth.current,
            layoutSize,
            setLayoutSize
        )
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
                style={scrollStyle}
                children={children}
                parent={props.parent} />
        </div>
    )
}

export default UIScrollPanel