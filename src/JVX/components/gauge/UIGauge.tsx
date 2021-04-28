/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";
import useDataProviderData from "../zhooks/useDataProviderData";
import { jvxContext } from "../../jvxProvider";
import useTranslation from "../zhooks/useTranslation";
import tinycolor from "tinycolor2";
import useRowSelect from "../zhooks/useRowSelect";

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
enum GAUGE_STYLES {
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
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IGauge>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id, maxValue, data, columnLabel, gaugeStyle, title} = props;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (wrapperRef.current) {
            sendOnLoadCallback(
                id, 
                parseJVxSize(props.preferredSize), 
                parseJVxSize(props.maximumSize), 
                parseJVxSize(props.minimumSize), 
                wrapperRef.current, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    let Gauge = RingGauge;

    switch(gaugeStyle) {
        case GAUGE_STYLES.STYLE_FLAT:
            Gauge = ArcGauge;
            break;
    }

    return (
        <span ref={wrapperRef} className="ui-gauge" style={layoutValue.has(id) ? layoutValue.get(id) : {position: "absolute"}}>
            <div className="ui-gauge__title">{title}</div>
            <Gauge value={data / maxValue} label={`${data} ${columnLabel}`} />
        </span>
    )
}

const RingGauge = ({
    value = 0, 
    size = 100, 
    thickness = 10, 
    color = "#F77777",
    background = "#808080",
    label = ""
}) => {
    const r = (size - thickness) * .5;
    const circumference = 2 * Math.PI * r;
    const hs = size * .5;

    return <div className="ui-gauge-ring">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`} >
            <mask id="mask">
                <circle 
                    cx={hs} 
                    cy={hs}
                    r={r}
                    strokeWidth={thickness}
                    stroke="#fff"
                    fill="none"
                />
            </mask>
            <g mask="url(#mask)">
                <circle 
                    cx={hs} 
                    cy={hs}
                    r={r}
                    strokeWidth={thickness + 2}
                    stroke={background}
                    fill="none"
                />
                <circle 
                    cx={hs} 
                    cy={hs}
                    r={r}
                    transform={`rotate(-90 ${hs} ${hs})`}
                    strokeWidth={thickness + 2}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={Math.max(0, Math.min(circumference, (1 - value) * circumference))}
                    fill="none"
                />
            </g>
        </svg>
        <div className="ui-gauge-ring__label">
            {label}
        </div>
    </div>
}

const ArcGauge = ({
    value = 0, 
    size = 100, 
    thickness = 10, 
    color = "#F77777",
    background = "#808080",
    label = ""
}) => {
    const r = (size - thickness) * .5;
    const circumference = Math.PI * r;
    const ht = thickness * .5;
    const hs = size * .5;

    return <div className="ui-gauge-arc">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`} >
            <mask id="mask">
                <path 
                    d={`M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`}
                    strokeWidth={thickness}
                    stroke="#fff"
                    fill="none"
                />
            </mask>
            <g transform={`translate(0 ${size * .25})`} mask="url(#mask)">
                <path 
                    d={`M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`}
                    strokeWidth={thickness + 2}
                    stroke={background}
                    fill="none"
                />
                <path 
                    d={`M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`}
                    strokeWidth={thickness + 2}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={Math.max(0, Math.min(circumference, (1 - value) * circumference))}
                    fill="none"
                />
            </g>
        </svg>
        <div className="ui-gauge-arc__label">
            {label}
        </div>
    </div>
}

export default UIGauge