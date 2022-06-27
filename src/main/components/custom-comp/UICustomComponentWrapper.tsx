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

import React, { FC, ReactElement, useLayoutEffect, useRef } from "react";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import BaseComponent from "../../util/types/BaseComponent";

/** Interface for CustomComponentWrapper */
export interface ICustomComponentWrapper extends BaseComponent {
    component: ReactElement,
    isGlobal:boolean
}

/**
 * This component wraps a custom-component which is passed when a developer using reactUI as library, so that
 * the necassary methods like onLoadCallback don't have to be implemented by the developer.
 * @param baseProps - Initial properties sent by the server for this component
 */
const UICustomComponentWrapper: FC<ICustomComponentWrapper> = (baseProps) => {
    /** Reference for the custom-component-wrapper element*/
    const wrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context,, [props], layoutStyle] = useComponentConstants<ICustomComponentWrapper>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout.
     * Remove the positioning and size properties before, so the custom-component reports its own size and not the component sent by the server.
     */
    useLayoutEffect(() => {
        if (wrapperRef.current) {
            const ref = wrapperRef.current
            ref.style.removeProperty("top");
            ref.style.removeProperty("left");
            ref.style.removeProperty("width");
            ref.style.removeProperty("height");
            sendOnLoadCallback(id, props.className, undefined, {width: 0x80000000, height: 0x80000000}, {width: 0, height: 0}, wrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    useLayoutEffect(() => {
        if (wrapperRef.current) {
            const ref = wrapperRef.current
            ref.style.setProperty("top", layoutStyle?.top !== undefined ? `${layoutStyle.top}px`: null)
            ref.style.setProperty("left", layoutStyle?.left !== undefined ? `${layoutStyle.left}px`: null);
            ref.style.setProperty("width", layoutStyle?.width !== undefined ? `${layoutStyle.width}px`: null);
            ref.style.setProperty("height", layoutStyle?.height !== undefined ? `${layoutStyle.height}px`: null);
        }
    }, [layoutStyle])

    return (
        <span ref={wrapperRef} style={layoutStyle}>
            {baseProps.isGlobal ? context.contentStore.globalComponents.get(props.className)!.apply(undefined, [{...props}]) : baseProps.component}
        </span>
    )
}
export default UICustomComponentWrapper;