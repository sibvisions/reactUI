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

import React, { FC, useLayoutEffect, useRef } from "react";
import useLayoutValue from "../hooks/style-hooks/useLayoutValue";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../util/server-util/SendOnLoadCallback";
import IBaseComponent from "../util/types/IBaseComponent";

/**
 * This component gets rendered when there is a component sent by the server which is not yet implemented on the client
 * @param props - Initial properties sent by the server for this component
 */
const Dummy: FC<IBaseComponent> = (props) => {
    const { id, onLoadCallback } = props;

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** Reference for the dummy */
    const ref = useRef<HTMLSpanElement>(null);

    // Logs the missing components properties
    useLayoutEffect(() => {
        console.log(props.id, props)
    },[])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(ref.current && onLoadCallback) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), ref.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return(
        <span ref={ref} style={layoutStyle}>
           {`Unsupported UI Component "${props.classNameEventSourceRef ? props.classNameEventSourceRef : props.className} ${props.id}"`}
        </span>
    )
}
export default Dummy