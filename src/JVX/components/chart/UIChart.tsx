/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** 3rd Party imports */
import {Chart} from 'primereact/chart';
import tinycolor from 'tinycolor2';

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";

/** Interface for Chartproperties sent by server */
export interface IChart extends BaseComponent {
    chartStyle: number
    data: Array<Array<any>>
    yColumnLabels: Array<string>
}

/** 
 * enum for different Chartstyles 
 */
enum CHART_STYLES {
    /** Style constant for showing a line chart. */
    LINES = 0,
    /** Style constant for showing an area chart. */
    AREA = 1,
    /** Style constant for showing a bar chart. */
    BARS = 2,
    /** Style constant for showing a pie chart. */
    PIE = 3,
    /** Style constant for showing an step line chart. */
    STEPLINES = 100,
    /** Style constant for showing an area chart. */
    STACKEDAREA = 101,
    /** Style constant for showing an area chart. */
    STACKEDPERCENTAREA = 201,
    /** Style constant for showing a stacked bar chart. */
    STACKEDBARS = 102,
    /** Style constant for showing a stacked bar chart. */
    STACKEDPERCENTBARS = 202,
    /** Style constant for showing a overlapped bar chart. */
    OVERLAPPEDBARS = 302,
    /** Style constant for showing a bar chart. */
    HBARS = 1002,
    /** Style constant for showing a stacked bar chart. */
    STACKEDHBARS = 1102,
    /** Style constant for showing a stacked bar chart. */
    STACKEDPERCENTHBARS = 1202,
    /** Style constant for showing a overlapped bar chart. */
    OVERLAPPEDHBARS = 1302,
    /** Style constant for showing a ring chart. */
    RING = 103,

}

/**
 * This component displays charts with various styles
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIChart: FC<IChart> = (baseProps) => {
    /** Reference for the span that is wrapping the chart containing layout information */
    const chartRef = useRef(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IChart>(baseProps.id, baseProps);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /**
     * Chart type to be displayed
     * @returns the chart type
     */
    const chartType = useMemo(() => {
        switch (props.chartStyle) {
            case CHART_STYLES.LINES: case CHART_STYLES.AREA: return "line";
            case CHART_STYLES.BARS: return "bar";
            default: return "pie"
        }
    },[props.chartStyle])


    /**
     * Returns the data of a chart and how it should be displayed
     * @returns the data of a chart and how it should be displayed
     */
    const chartData = useMemo(() => {
        const singleColor = tinycolor.random().toHexString();
        const primeChart = {
            labels: props.data.map(dataRow => dataRow[1]),
            datasets: [
                {
                    label: props.yColumnLabels[0],
                    data: props.data.map(dataRow => dataRow[0]),
                    backgroundColor: props.chartStyle === CHART_STYLES.PIE ? props.data.map(() => tinycolor.random().toHexString()): singleColor,
                    borderColor: props.chartStyle !== CHART_STYLES.PIE ? singleColor : undefined,
                    fill: props.chartStyle === CHART_STYLES.AREA ? true : false,
                    lineTension: 0,
                    pointRadius: props.chartStyle === CHART_STYLES.LINES ? 6 : 0,
                    pointHitRadius: props.chartStyle === CHART_STYLES.LINES ? 7 : 0,
                }
            ]
        }
        return primeChart
    },[props.data, props.chartStyle, props.yColumnLabels]);

    
    /**
     * Returns the maximum value of the data
     * @returns max value of data
     */
    const getMaxDataVal = () => {
        let tempArray:Array<number> = [];
        props.data.forEach(dataRow => {
            tempArray.push(dataRow[0])
        })
        return Math.max(...tempArray)
    }

    /**
     * Returns options for display mostly for legend and axes
     * @param style - chartstyle pie, bar...
     * @returns options for display
     */
    const options = (style:number) => {
        if (style === CHART_STYLES.PIE)
            return {
                    legend: {
                        display: false
                    }
            }
        else {
            return {
                legend: {
                    position: 'bottom'
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            callback: function(value:any) {
                                return value.substr(0, 10)+"...";//truncate
                            },
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0,
                            max: getMaxDataVal()
                        }
                    }]
                },
            }
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (chartRef.current)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), chartRef.current, onLoadCallback)
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    return (
        <span ref={chartRef} style={layoutValue.has(id) ? layoutValue.get(id) : {position: "absolute"}}>
            <Chart
                type={chartType}
                data={chartData}
                options={options(props.chartStyle)}/>
        </span>
    )
}
export default UIChart