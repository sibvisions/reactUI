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
 * 0 = Line
 * 1 = Area
 * 2 = Bars
 * 3 = Pie
 */
enum CHART_STYLES {
    LINES=0,
    AREAS=1,
    BARS=2,
    PIE=3

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
            case CHART_STYLES.LINES: case CHART_STYLES.AREAS: return "line";
            case CHART_STYLES.BARS: return "bar";
            default: return "pie"
        }
    },[props.chartStyle])


    /**
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
                    fill: props.chartStyle === CHART_STYLES.AREAS ? true : false,
                    lineTension: 0,
                    pointRadius: props.chartStyle === CHART_STYLES.LINES ? 6 : 0,
                    pointHitRadius: props.chartStyle === CHART_STYLES.LINES ? 7 : 0,
                }
            ]
        }
        return primeChart
    },[props.data, props.chartStyle, props.yColumnLabels]);

    const getMaxDataVal = () => {
        let tempArray:Array<number> = [];
        props.data.forEach(dataRow => {
            tempArray.push(dataRow[0])
        })
        return Math.max(...tempArray)
    }

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
    })

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