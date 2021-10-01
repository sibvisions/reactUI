/** React imports */
import React, { FC, useContext, useMemo, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback } from "../../util";
import { appContext } from "../../../AppProvider";
import { IPanel } from "..";

const UIToolBarHelper: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Children of this panel */
    const children = useMemo(() => {
        return new Map([...context.contentStore.getChildren(props.parent as string)].filter(entry => props.id.includes("-tbMain") ? entry[1]["~additional"] : !entry[1]["~additional"] && !entry[0].includes("-tb")));
    }, [props.parent]);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, children);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /**
     * Returns the style of the panel/layout
     * @returns style of panel/layout
     */
     const getStyle = () => {
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
        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
     const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        if (onLoadCallback) {
            sendOnLoadCallback(
                id, props.preferredSize ? parsePrefSize(props.preferredSize) : prefSize, 
                parseMaxSize(props.maximumSize), 
                props.minimumSize ? parseMinSize(props.minimumSize) : (minSize ? minSize : parseMinSize(props.minimumSize)), 
                undefined, 
                onLoadCallback
            );
        }
    }

    return (
        <div
            className={id.includes("-tbMain") ? "rc-toolbar" : "rc-panel"}
            ref={panelRef}
            id={props.name} 
            style={props.screen_modal_ ? { 
                height: prefSize?.height, 
                width: prefSize?.width,
                ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
            } : {
                ...layoutStyle, 
                backgroundColor: props.background,
                ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
            }}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                popupSize={parsePrefSize(props.screen_size_)}
                reportSize={reportSize}
                compSizes={componentSizes ? new Map([...componentSizes].filter((v, k) => !v[0].includes("-tb"))) : undefined}
                components={id.includes("-tbMain") ? components.filter(comp => comp.props["~additional"] && !comp.props.id.includes("-tb")) : components.filter(comp => !comp.props["~additional"] && !comp.props.id.includes("-tb"))}
                style={getStyle()} 
                children={children}
                parent={props.parent} />
        </div>
    )   
}
export default UIToolBarHelper