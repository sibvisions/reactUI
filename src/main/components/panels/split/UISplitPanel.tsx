import React, { CSSProperties, FC, ReactElement, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useComponents, useMouseListener, usePopupMenu, useComponentConstants } from "../../zhooks";
import SplitPanel from "./SplitPanel";
import {LayoutContext} from "../../../LayoutContext";
import BaseComponent from "../../BaseComponent";
import {ChildWithProps, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, checkComponentName} from "../../util";

/** Interface for UISplitPanel */
export interface ISplit extends BaseComponent{
    dividerAlignment: number,
    dividerPosition: number,
    orientation: 0|1
}

/**
 * This component wraps the SplitPanel and provides it with properties
 * @param baseProps - Initial properties sent by the server for this component
 */
const UISplitPanel: FC<ISplit> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<ISplit>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children */
    const [children, components, compSizes] = useComponents(props.id, props.className);

    /**
     * Returns the child based on its constraint
     * @param constraint - the constraint of the child
     * @returns the child based on its constraint
     */
    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return components.find((component) => {
            const compProp = children.find(comp => comp.id === component.props.id);
            if(compProp) {
                return compProp.constraints === constraint;
            }
            return false;
        });
    }

    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());

    /** The "first" Childcomponent in the SplitPanel */
    const firstChild = getChildByConstraint("FIRST_COMPONENT");

    /** The "second" Childcomponent in the SplitPanel */
    const secondChild = getChildByConstraint("SECOND_COMPONENT");

    /** Reference for the SplitPanel which gets forwarded to inner component */
    const splitRef = useRef<any>(null);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

    /** Hook for MouseListener */
    useMouseListener(props.name, splitRef.current ? splitRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (splitRef.current) {
            if(onLoadCallback && compSizes && compSizes.size) {
                sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), splitRef.current, onLoadCallback);
            }
        }
    }, [id, onLoadCallback, props.preferredSize, props.maximumSize, props.minimumSize, componentSizes, compSizes])

    // Callback which is passed to splitpanel and called initially
    const sendLoadCallback = () => {
        const size:Dimension = { height: splitRef.current.offsetHeight, width: splitRef.current.offsetWidth }
        if (onLoadCallback) {
            if (props.preferredSize) {
                sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), splitRef.current, onLoadCallback);
            }
            else {
                sendOnLoadCallback(id, props.className, size, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), splitRef.current, onLoadCallback);
            }
        }
    }

    /**
     * When the sSplitPanel gets resized, rebuild the sizeMap for the layout sizes
     * @param firstSize - the size of the "first" component
     * @param secondSize  - the size of the "second" component
     */
    const handleResize = (firstSize: Dimension, secondSize: Dimension) => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();
        /** Cast children to get props */
        const firstProps = (firstChild as ChildWithProps);
        const secondProps = (secondChild as ChildWithProps);

        sizeMap.set(firstProps.props.id, firstSize);
        sizeMap.set(secondProps.props.id, secondSize);

        setComponentSizes(sizeMap);
    }

    return(
        <LayoutContext.Provider value={componentSizes}>
            <SplitPanel
                id={checkComponentName(props.name)}
                style={layoutStyle}
                forwardedRef={splitRef}
                trigger={layoutStyle}
                onTrigger={handleResize}
                onResize={handleResize}
                leftComponent={firstChild}
                rightComponent={secondChild}
                dividerPosition={props.dividerPosition}
                orientation={props.orientation}
                onInitial={sendLoadCallback}
                toolTipText={props.toolTipText}
                popupMenu={{...usePopupMenu(props)}}
            />
        </LayoutContext.Provider>
    )
}
export default UISplitPanel