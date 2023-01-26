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
import BaseComponent from "../../util/types/BaseComponent";
import { RingGauge, ArcGauge, MeterGauge, SpeedometerGauge } from "ui-gauges";
import { Tooltip } from "primereact/tooltip";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import useFetchMissingData from "../../hooks/data-hooks/useFetchMissingData";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import useAddLayoutStyle from "../../hooks/style-hooks/useAddLayoutStyle";

/** Interface for Gauge properties sent by server */
export interface IGauge extends BaseComponent {
    title: string
    gaugeStyle: number
    minWarningValue: number
    minErrorValue: number
    maxWarningValue: number
    maxValue: number
    maxErrorValue: number
    data: number
    dataBook: string
    columnLabel: string
}

/** 
 * enum for different gauge styles 
 */
export enum GAUGE_STYLES {
    STYLE_SPEEDOMETER = 0,
    STYLE_METER = 1,
    STYLE_RING = 2,
    STYLE_FLAT = 3,
}

/**
 * This component displays gauges with various styles
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGauge: FC<IGauge> = (baseProps) => {
    /** Reference for the span that is wrapping the chart containing layout information */
    const wrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context,, [props], layoutStyle] = useComponentConstants<IGauge>(baseProps);

    /** ComponentId of the screen */
    const screenName = context.contentStore.getScreenName(props.id, props.dataBook) as string;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id, maxValue, data, columnLabel, gaugeStyle, title, minErrorValue, minWarningValue, maxWarningValue, maxErrorValue, name} = props;

    /** Reference for the gauge */
    const gauge = useRef<any>(null);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(screenName, props.dataBook);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapperRef.current ? wrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (wrapperRef.current && onLoadCallback) {
            sendOnLoadCallback(
                id,
                props.className, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                wrapperRef.current, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    useAddLayoutStyle(wrapperRef.current, layoutStyle, onLoadCallback);

    // Sets the gauge properties on render
    useLayoutEffect(() => {
        if(wrapperRef.current && !gauge.current) {
            switch(gaugeStyle) {
                case GAUGE_STYLES.STYLE_METER:
                    gauge.current = new MeterGauge(wrapperRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
                case GAUGE_STYLES.STYLE_FLAT:
                    gauge.current = new ArcGauge(wrapperRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
                case GAUGE_STYLES.STYLE_RING:
                    gauge.current = new RingGauge(wrapperRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue],
                        formatValue: props.id === "login-gauge" ? (x) => new Date(x).toISOString().substring(14, 19) : undefined 
                    });
                    break;
                default:
                    gauge.current = new SpeedometerGauge(wrapperRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
            }
        } else if(gauge.current) {
            gauge.current.update({
                id: name,
                value: props.id === "login-gauge" ? baseProps.data : data, 
                title,
                label: columnLabel, 
                max: maxValue,
                steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue],
            })
        }
    });

    console.log(props.id, layoutStyle)

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <span 
                id={props.name} 
                {...usePopupMenu(props)} 
                ref={wrapperRef} 
                className={concatClassnames("ui-gauge", props.style)}
                style={props.id === "login-gauge" ? props.name === "login-gauge-wait" ? { height: "100px", width: "100px" } : { height: "75px", width: "75px" } : layoutStyle} 
                data-pr-tooltip={props.toolTipText} 
                data-pr-position="left"
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            </span>
        </>
    )
}

export default UIGauge