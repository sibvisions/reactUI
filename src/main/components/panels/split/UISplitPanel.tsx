/** React imports */
import React, { CSSProperties, FC, ReactElement, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

/** Hook imports */
import { useProperties, useComponents } from "../../zhooks";

/** Other imports */
import SplitPanel from "./SplitPanel";
import { appContext } from "../../../AppProvider";
import {LayoutContext} from "../../../LayoutContext";
import BaseComponent from "../../BaseComponent";
import {ChildWithProps, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension} from "../../util";

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
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutContext = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);
    /** The Childcomponents of this SplitPanel */
    const children = useMemo(() => {
        return context.contentStore.getChildren(props.id);
    }, [context.contentStore, props.id])

    /**
     * Returns the child based on its constraint
     * @param constraint - the constraint of the child
     * @returns the child based on its constraint
     */
    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return components.find((component) => {
            const compProp = children.get(component.props.id);
            if(compProp)
                return compProp.constraints === constraint;

            return false;
        });
    }
    /** Current state of all Childcomponents as react children */
    const [components] = useComponents(props.id);
    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    /** The "first" Childcomponent in the SplitPanel */
    const firstChild = getChildByConstraint("FIRST_COMPONENT");
    /** The "second" Childcomponent in the SplitPanel */
    const secondChild = getChildByConstraint("SECOND_COMPONENT");
    /** Reference for the SplitPanel which gets forwarded to inner component */
    const splitRef = useRef(null);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (splitRef.current) {
            if(onLoadCallback)
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), splitRef.current, onLoadCallback);
        }
    }, [id, onLoadCallback, props.preferredSize, props.maximumSize, props.minimumSize])

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
                style={layoutContext.get(props.id)}
                forwardedRef={splitRef}
                trigger={layoutContext}
                onTrigger={handleResize}
                onResize={handleResize}
                leftComponent={firstChild}
                rightComponent={secondChild}
                dividerPosition={props.dividerPosition}
                orientation={props.orientation}
            />
        </LayoutContext.Provider>
    )
}
export default UISplitPanel