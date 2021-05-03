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

/** Color for ok value. */
const colorOK = "#55BF3B";
/** Color for warning value. */
const colorWarning = "#DDDF0D";
/** Color for error value. */
const colorError = "#DF5353";

function getColor(value: number, steps?: [number, number, number, number]) {
    if(!steps) {
        return colorOK;
    }
    if(value <= steps[0] || value >= steps[3]) {
        return colorError;
    } else if (value <= steps[1] || value >= steps[2]) {
        return colorWarning;
    } else {
        return colorOK;
    }
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
    const {onLoadCallback, id, maxValue, data, columnLabel, gaugeStyle, title, minErrorValue, minWarningValue, maxWarningValue, maxErrorValue} = props;

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

    let Gauge:React.ComponentType<GaugeProps> = SpeedometerGauge;

    switch(gaugeStyle) {
        case GAUGE_STYLES.STYLE_METER:
            Gauge = MeterGauge;
            break;
        case GAUGE_STYLES.STYLE_FLAT:
            Gauge = ArcGauge;
            break;
        case GAUGE_STYLES.STYLE_RING:
            Gauge = RingGauge;
            break;
    }

    return (
        <span ref={wrapperRef} className="ui-gauge" style={layoutValue.has(id) ? layoutValue.get(id) : {position: "absolute"}}>
            <div className="ui-gauge__title">{title}</div>
            <Gauge 
                id={id}
                value={data} 
                label={`${data} ${columnLabel}`} 
                max={maxValue}
                steps={[minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]}
            />
        </span>
    )
}

interface GaugeProps {
    id: string
    value: number 
    size?: number
    thickness?: number
    color?: string
    background?: string
    label?: string
    min?: number
    max?: number
    steps?: [number, number, number, number]
    ticks?: number
    subTicks?: number
    circle?: number
}

const RingGauge: React.FC<GaugeProps> = ({
    value = 0, 
    max = 10,
    size = 100, 
    thickness = 10, 
    background = "#808080",
    label = "",
    color,
    steps,
    id
}) => {
    const r = (size - thickness) * .5;
    const circumference = 2 * Math.PI * r;
    const hs = size * .5;

    const maskID = `mask-${id}`;

    color = color || getColor(value, steps);

    return <div className="ui-gauge-ring">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`} >
            <mask id={maskID}>
                <circle 
                    cx={hs} 
                    cy={hs}
                    r={r}
                    strokeWidth={thickness}
                    stroke="#fff"
                    fill="none"
                />
            </mask>
            <g mask={`url(#${maskID})`}>
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
                    strokeDashoffset={Math.max(0, Math.min(circumference, (1 - value / max) * circumference))}
                    fill="none"
                />
            </g>
        </svg>
        <div className="ui-gauge-ring__label">
            {label}
        </div>
    </div>
}

const ArcGauge: React.FC<GaugeProps> = ({
    value = 0, 
    max = 10,
    size = 100, 
    thickness = 10, 
    background = "#808080",
    label = "",
    color,
    steps,
    id
}) => {
    const r = (size - thickness) * .5;
    const circumference = Math.PI * r;
    const ht = thickness * .5;
    const hs = size * .5;

    const maskID = `mask-${id}`;

    color = color || getColor(value, steps);

    return <div className="ui-gauge-arc">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`} >
            <mask id={maskID}>
                <path 
                    d={`M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`}
                    strokeWidth={thickness}
                    stroke="#fff"
                    fill="none"
                />
            </mask>
            <g transform={`translate(0 ${size * .25})`} mask={`url(#${maskID})`}>
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
                    strokeDashoffset={Math.max(0, Math.min(circumference, (1 - value / max) * circumference))}
                    fill="none"
                />
            </g>
        </svg>
        <div className="ui-gauge-arc__label">
            {label}
        </div>
    </div>
}

const SpeedometerGauge: React.FC<GaugeProps> = (props) => {
    return <MeterGauge {...props} ticks={11} subTicks={3} circle={.75} />
}

const MeterGauge: React.FC<GaugeProps> = ({
    value = 0, 
    size = 100, 
    thickness = 4, 
    label = "",
    max = 10,
    ticks = 5,
    subTicks = 4,
    steps,
    id,
    circle = .25,
}) => {
    const r = (size - thickness) * .5;
    const tr = r + thickness * .25;
    const ir = r - thickness - 2;
    const circumference = 2 * Math.PI * r * circle;
    const tickCircumference = 2 * Math.PI * tr * circle;
    const innerCircumference =  2 * Math.PI * ir * circle;
    const ht = thickness * .5;
    const hs = size * .5;
    const sin = (1 - Math.sin(Math.PI * circle));
    const inset = sin * r;
    const iinset = sin * ir;
    const tinset = sin * tr;

    const tickSize = 1;
    const subTickSize = .5;
    const needleOrigin = hs;
    const needleLength = needleOrigin + thickness;
    const needleRotation = 360 * circle * value / max - 180 * circle;

    let dasharray = [tickSize, circumference / (ticks - 1) - tickSize];
    let subDasharray: number[] = [];

    if (subTicks > 0) {
        const tickSegment = ((tickCircumference / (ticks - 1) - tickSize) - subTicks * subTickSize) / (subTicks + 1);
        subDasharray = [0, tickSize + tickSegment];
        for (let i = 0; i < subTicks; i++) {
            subDasharray.push(subTickSize, tickSegment)
        }
    }

    const maskID = `mask-${id}`;
    const markerID = `end-${id}`;

    const height = Math.sqrt(r * r - Math.pow(r - inset, 2));
    const bottom = (circle >= .5 ? r + height : r - height) + thickness * .5;
    const leftScale = ht + thickness + 2 + iinset;
    const rightScale = size - ht - thickness - 2 - iinset;
    const scaleHeight = Math.sqrt(ir * ir - Math.pow(ir - iinset, 2));
    const bottomScale = (circle >= .5 ? ir + scaleHeight : ir - scaleHeight) + thickness + 4;

    const ticksHeight = Math.sqrt(tr * tr - Math.pow(tr - tinset, 2));
    const bottomTicks = (circle >= .5 ? tr + ticksHeight : tr - ticksHeight) + thickness * .25;

    const arcFlag = circle >= .5 ? 1 : 0;

    return <div className="ui-gauge-speedometer">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`} >
            <defs>
                <marker id={markerID} viewBox={`0 0 ${tickSize} ${thickness}`}
                    refX={tickSize * .5} refY={thickness * .5}
                    markerUnits="userSpaceOnUse"
                    markerWidth={tickSize} 
                    markerHeight={thickness}
                    orient="auto">
                    <rect x="0" y="0" width={tickSize} height={thickness} />
                </marker>
            </defs>
            <mask id={maskID}>
                <path 
                    d={`M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`}
                    strokeWidth={thickness - 1}
                    stroke="#fff"
                    fill="none"
                />
            </mask>
            <g transform={`translate(0 0)`}>
                {steps ? <g mask={`url(#${maskID})`}>
                    <path 
                        d={`M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`}
                        strokeWidth={thickness}
                        stroke={colorOK}
                        fill="none"
                    />
                    <path 
                        d={`M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`}
                        strokeWidth={thickness}
                        strokeDasharray={`${innerCircumference * steps[1] / max} ${innerCircumference * (steps[2] - steps[1]) / max} ${innerCircumference}`}
                        stroke={colorWarning}
                        fill="none"
                    />
                    <path 
                        d={`M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`}
                        strokeWidth={thickness}
                        strokeDasharray={`${innerCircumference * steps[0] / max} ${innerCircumference * (steps[3] - steps[0]) / max} ${innerCircumference}`}
                        stroke={colorError}
                        fill="none"
                    />
                </g> : null}

                <path 
                    d={`M ${ht + inset} ${bottom} A ${r} ${r} 0 ${arcFlag} 1 ${size - ht - inset} ${bottom}`}
                    strokeWidth={thickness}
                    strokeDasharray={dasharray.join(' ')}
                    strokeDashoffset={tickSize * .5}
                    stroke="#000"
                    marker-start={`url(#${markerID})`}
                    marker-end={`url(#${markerID})`}
                    fill="none"
                />

                {subDasharray.length ? <path 
                    d={`M ${ht + tinset - thickness * .25} ${bottomTicks} A ${tr} ${tr} 0 ${arcFlag} 1 ${size - ht - tinset + thickness * .25} ${bottomTicks}`}
                    strokeWidth={thickness * .5}
                    strokeDasharray={subDasharray.join(' ')}
                    strokeDashoffset={tickSize * .5}
                    stroke="#000"
                    fill="none"
                /> : null}
            
                <path 
                    d={`m ${hs} ${needleOrigin}, -2.5 2.5, 2.5 -${needleLength}, 2.5 ${needleLength}z`} 
                    transform={`rotate(${needleRotation} ${hs} ${hs})`}
                    fill="#000" 
                />
            </g>
        </svg>
        <div className="ui-gauge-speedometer__label">
            {label}
        </div>
    </div>
}

export default UIGauge