import React, { FC, useLayoutEffect, useRef } from "react";
import { useComponentConstants, useFetchMissingData, useMouseListener, usePopupMenu } from "../zhooks";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, checkComponentName, getTabIndex } from "../util";
import BaseComponent from "../BaseComponent";
import { RingGauge, ArcGauge, MeterGauge, SpeedometerGauge } from "ui-gauges";
import { Tooltip } from "primereact/tooltip";

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
const colorOK = "var(--gauge-color__ok)"; //"#55BF3B"
/** Color for warning value. */
const colorWarning = "var(--gauge-color__warning)"; //"#DDDF0D"
/** Color for error value. */
const colorError = "var(--gauge-color__error)"; //"#DF5353"

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

    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IGauge>(baseProps);

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
        if (wrapperRef.current) {
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
                        steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
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
                value: data, 
                title,
                label: columnLabel, 
                max: maxValue,
                steps: [minErrorValue, minWarningValue, maxWarningValue, maxErrorValue]
            })
        }
    });



    return (
        <>
            <Tooltip target={"#" + checkComponentName(props.name)} />
            <span 
                id={checkComponentName(props.name)} 
                {...usePopupMenu(props)} 
                ref={wrapperRef} 
                className="ui-gauge" 
                style={layoutStyle} 
                data-pr-tooltip={props.toolTipText} 
                data-pr-position="left"
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            </span>
        </>
    )
}

export default UIGauge