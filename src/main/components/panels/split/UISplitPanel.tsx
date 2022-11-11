/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { CSSProperties, FC, ReactElement, useLayoutEffect, useRef, useState } from "react";
import SplitPanel, { ORIENTATIONSPLIT } from "./SplitPanel";
import {LayoutContext} from "../../../LayoutContext";
import BaseComponent from "../../../util/types/BaseComponent";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useComponents from "../../../hooks/components-hooks/useComponents";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import Dimension from "../../../util/types/Dimension";
import ChildWithProps from "../../../util/types/ChildWithProps";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { IExtendableSplitPanel } from "../../../extend-components/panels/ExtendSplitPanel";

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
const UISplitPanel: FC<ISplit & IExtendableSplitPanel> = (baseProps) => {
    /** Component constants */
    const [,, [props], layoutStyle] = useComponentConstants<ISplit & IExtendableSplitPanel>(baseProps, {visibility: 'hidden'});

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
        let size:Dimension = { height: splitRef.current.offsetHeight, width: splitRef.current.offsetWidth }
        if (compSizes && compSizes.size) {
            let testWidth = 0;
            let testHeight = 0;
            compSizes.forEach(comp => {
                testWidth += comp.preferredSize.width;
                testHeight += comp.preferredSize.height;
            });

            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                testWidth += 10;
            }
            else {
                testHeight += 10;
            }
            size = { height: testHeight, width: testWidth }
        }
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
                id={props.name}
                style={layoutStyle}
                forwardedRef={splitRef}
                trigger={layoutStyle}
                onTrigger={handleResize}
                onResize={handleResize}
                onResizeExtend={props.onResize}
                onResizeEndExtend={props.onResizeEnd}
                leftComponent={firstChild}
                rightComponent={secondChild}
                dividerPosition={props.dividerPosition}
                orientation={props.orientation}
                onInitial={sendLoadCallback}
                toolTipText={props.toolTipText}
                popupMenu={{...usePopupMenu(props)}}
                styleClassName={props.style}
            />
        </LayoutContext.Provider>
    )
}
export default UISplitPanel