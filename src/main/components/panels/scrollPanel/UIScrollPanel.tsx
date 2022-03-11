/** React imports */
import React, { CSSProperties, FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { Tooltip } from "primereact/tooltip";

/** Hook imports */
import { useComponents, useMouseListener, usePopupMenu, useComponentConstants } from "../../zhooks";

/** Other imports */

import { IPanel } from "..";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, panelReportSize, panelGetStyle, concatClassnames, checkComponentName } from "../../util";

/**
 * This component displays a panel in which you will be able to scroll
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIScrollPanel: FC<IPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(baseProps.id, props.className);

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
    const [layoutSize, setLayoutSize] = useState<Dimension>();

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const scrollStyle = useMemo(() => {
        let s:React.CSSProperties = panelGetStyle(false, layoutStyle, prefSize, props.screen_modal_ || props.content_modal_, props.screen_size_);
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

    }, [componentSizes, layoutStyle?.width, layoutStyle?.height, props.screen_modal_, layoutSize, props.content_modal_])

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = useCallback((prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "P", 
            prefSize,
            props.className,
            { height: 17, width: 17 },
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback,
            minusHeight.current,
            minusWidth.current,
            layoutSize,
            setLayoutSize
        )
    }, [onLoadCallback])

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                ref={panelRef}
                id={checkComponentName(props.name)}
                className={concatClassnames(
                    "rc-scrollpanel"
                )}
                style={props.screen_modal_ || props.content_modal_
                    ? {
                        height: (prefSize?.height as number),
                        width: prefSize?.width,
                        overflow: 'auto',
                        ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
                    }
                    : {
                        ...layoutStyle,
                        ...compStyle,
                        overflow: 'auto',
                        ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
                    }
                }
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
            >
                <Layout
                    id={id}
                    className={props.className}
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
                    parent={props.parent} />
            </div>
        </>
    )
}

export default UIScrollPanel