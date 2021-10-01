/** React imports */
import React, { CSSProperties, FC, useContext, useMemo, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { IPanel } from "..";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, panelReportSize } from "../../util";
import { appContext } from "../../../AppProvider";

/**
 * This component is a panel with a header, useful to group components
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGroupPanel: FC<IPanel> = (baseProps) => {
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

    /** Reference for the panel element */
    const panelRef = useRef<any>(null)

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
        s.top = undefined;
        s.left = undefined;

        if(s.width !== undefined) {
            (s.width as number) -= 0;
        }
        /** Tell layout that because of the header it is ~28px smaller */
        if(s.height !== undefined) {
            (s.height as number) -= 28;
        }

        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "G", 
            prefSize, 
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }

    return (
        <div
            ref={panelRef}
            className="rc-panel-group"
            id={props.name}
            style={props.screen_modal_ ?
                { height: (prefSize?.height as number), width: prefSize?.width }
                : { ...layoutStyle, backgroundColor: props.background }} >
            <div
                className="rc-panel-group-caption">
                <span>
                    {props.text}
                </span>
            </div>
            <div 
                className="rc-panel-group-content"
                style={{...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {}) }}>
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
                    style={getStyle()}
                    children={children}
                    parent={props.parent} />
            </div>
        </div>
    )
}

export default UIGroupPanel