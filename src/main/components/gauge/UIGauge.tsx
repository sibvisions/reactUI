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
import IBaseComponent from "../../util/types/IBaseComponent";
import { RingGauge, ArcGauge, MeterGauge, SpeedometerGauge } from "ui-gauges";
import { Tooltip } from "primereact/tooltip";
import useFetchMissingData from "../../hooks/data-hooks/useFetchMissingData";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IComponentConstants } from "../BaseComponent";

/** Interface for Gauge properties sent by server */
export interface IGauge extends IBaseComponent {
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
const UIGauge: FC<IGauge & IComponentConstants> = (props) => {
    /** ComponentId of the screen */
    const screenName = props.context.contentStore.getScreenName(props.id, props.dataBook) as string;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id, maxValue, data, columnLabel, gaugeStyle, title, minErrorValue, minWarningValue, maxWarningValue, maxErrorValue, name} = props;

    /** Reference for the gauge */
    const gauge = useRef<any>(null);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(screenName, props.dataBook);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current && onLoadCallback) {
            sendOnLoadCallback(
                id,
                props.className, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                props.forwardedRef.current, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    // Sets the gauge properties on render. You pass the gauge an HTMLElement and the properties and the gauge renders itself via dom manipulation
    // No need for a gauge component here
    useLayoutEffect(() => {
        if(props.forwardedRef.current && !gauge.current) {
            switch(gaugeStyle) {
                case GAUGE_STYLES.STYLE_METER:
                    gauge.current = new MeterGauge(props.forwardedRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        hideValue: props.id !== "login-gauge",
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
                case GAUGE_STYLES.STYLE_FLAT:
                    gauge.current = new ArcGauge(props.forwardedRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        hideValue: props.id !== "login-gauge",
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
                case GAUGE_STYLES.STYLE_RING:
                    gauge.current = new RingGauge(props.forwardedRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        hideValue: props.id !== "login-gauge",
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue],
                        formatValue: props.id === "login-gauge" ? (x) => new Date(x).toISOString().substring(14, 19) : undefined 
                    });
                    break;
                default:
                    gauge.current = new SpeedometerGauge(props.forwardedRef.current, {
                        id: name,
                        value: data, 
                        title,
                        label: columnLabel, 
                        max: maxValue,
                        size: 300,
                        hideValue: props.id !== "login-gauge",
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
                    });
                    break;
            }
        } else if(gauge.current) {
            gauge.current.update({
                id: name,
                value: props.id === "login-gauge" ? props.data : data, 
                title,
                label: columnLabel, 
                max: maxValue,
                hideValue: props.id !== "login-gauge",
                steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue],
            })
        }
    });

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <span 
                id={props.name} 
                {...usePopupMenu(props)} 
                ref={props.forwardedRef} 
                className={concatClassnames("ui-gauge", props.styleClassNames)}
                style={props.id === "login-gauge" ? props.name === "login-gauge-wait" ? { height: "100px", width: "100px" } : { height: "75px", width: "75px" } : props.layoutStyle} 
                data-pr-tooltip={props.toolTipText} 
                data-pr-position="left"
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            </span>
        </>
    )
}

export default UIGauge