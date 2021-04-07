// API docs for ChartJS Version used in Prime React - https://www.chartjs.org/docs/2.7.3/

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
import useDataProviderData from "../zhooks/useDataProviderData";
import { jvxContext } from "src/JVX/jvxProvider";

/** Interface for Chartproperties sent by server */
export interface IChart extends BaseComponent {
    chartStyle: number
    dataBook: string
    xColumnName: string
    xColumnLabel: string
    yColumnNames: string[]
    yColumnLabels: string[]
    xAxistTitle: string
    yAxistTitle: string
    data: Array<Array<any>>
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
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IChart>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** The data provided by the databook */
    const [providerData]:any[][] = useDataProviderData(compId, props.dataBook);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    //console.log(props, providerData);

    /**
     * Chart type to be displayed
     * @returns the chart type
     */
    const chartType = useMemo(() => {
        switch (props.chartStyle) {
            case CHART_STYLES.LINES: 
            case CHART_STYLES.AREA: 
            case CHART_STYLES.STEPLINES: 
            case CHART_STYLES.STACKEDAREA: 
            case CHART_STYLES.STACKEDPERCENTAREA: 
                return "line";
            case CHART_STYLES.BARS: 
            case CHART_STYLES.STACKEDBARS: 
            case CHART_STYLES.STACKEDPERCENTBARS: 
            case CHART_STYLES.OVERLAPPEDBARS: 
                return "bar";
            case CHART_STYLES.HBARS: 
            case CHART_STYLES.STACKEDHBARS: 
            case CHART_STYLES.STACKEDPERCENTHBARS: 
            case CHART_STYLES.OVERLAPPEDHBARS: 
                return "horizontalBar";
            case CHART_STYLES.RING: 
                return "doughnut";
            case CHART_STYLES.PIE:
            default: 
                return "pie";
        }
    },[props.chartStyle])

    /**
     * Returns the data of a chart and how it should be displayed
     * @returns the data of a chart and how it should be displayed
     */
    const chartData = useMemo(() => {
        let { chartStyle = CHART_STYLES.PIE, yColumnLabels, yColumnNames } = props;
        yColumnLabels = yColumnLabels || [];
        yColumnNames = yColumnNames || [];
        const primeChart = {
            labels: [...Array(providerData.length).keys()],
            datasets: yColumnNames.map((name, idx) => {
                const singleColor = tinycolor.random().toHexString();
                return {
                    label: yColumnLabels[idx],
                    data: providerData.map(dataRow => dataRow[name]),
                    backgroundColor: [CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle) ? 
                        [...Array(providerData.length).keys()].map(() => tinycolor.random().toHexString()) : singleColor,
                    borderColor: ![CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle) ? singleColor : undefined,
                    fill: [CHART_STYLES.AREA, CHART_STYLES.STACKEDAREA, CHART_STYLES.STACKEDPERCENTAREA].includes(chartStyle) ? 'origin' : false,
                    lineTension: 0,
                    pointRadius: CHART_STYLES.LINES === chartStyle ? 6 : 0,
                    pointHitRadius: CHART_STYLES.LINES === chartStyle ? 7 : 0,
                    steppedLine: CHART_STYLES.STEPLINES === chartStyle,
                }
            })
        }
        return primeChart
    },[providerData, props.chartStyle, props.yColumnLabels]);

    
    /**
     * Returns the maximum value of the data
     * @returns max value of data
     */
    const getMaxDataVal = () => {
        const stacked = [
            CHART_STYLES.STACKEDAREA, 
            CHART_STYLES.STACKEDBARS, 
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTAREA,
            CHART_STYLES.STACKEDPERCENTBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
        ].includes(props.chartStyle);
        let { yColumnNames } = props;
        yColumnNames = yColumnNames || [];
        return providerData ? Math.max(...providerData.map(dataRow => stacked ? 
            yColumnNames.reduce((agg, n) => agg + dataRow[n], 0) : 
            Math.max(...yColumnNames.map(n => dataRow[n])))) + 1 : 1
    }

    /**
     * Returns the minimum value of the data or 0
     * @returns min value of data
     */
     const getMinDataVal = () => {    
        const stacked = [
            CHART_STYLES.STACKEDAREA, 
            CHART_STYLES.STACKEDBARS, 
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTAREA,
            CHART_STYLES.STACKEDPERCENTBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
        ].includes(props.chartStyle);
        let { yColumnNames } = props;
        yColumnNames = yColumnNames || [];
        return providerData ? Math.min(0, ...providerData.map(dataRow => stacked ? 
            yColumnNames.reduce((agg, n) => agg + dataRow[n], 0) : 
            Math.min(...yColumnNames.map(n => dataRow[n])))) : 0
    }

    /**
     * Returns options for display mostly for legend and axes
     * @param style - chartstyle pie, bar...
     * @returns options for display
     */
    const options = useMemo(() => {
        const {chartStyle = CHART_STYLES.PIE} = props;
        if ([CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle)) {
            return {
                legend: {
                    display: false
                }
            }
        } else {
            let xAxes:any[] = [{
                stacked: [
                    CHART_STYLES.STACKEDAREA, 
                    CHART_STYLES.STACKEDBARS, 
                    CHART_STYLES.STACKEDHBARS,
                    CHART_STYLES.STACKEDPERCENTAREA,
                    CHART_STYLES.STACKEDPERCENTBARS,
                    CHART_STYLES.STACKEDPERCENTHBARS,
                ].includes(chartStyle),
                ticks: {
                    callback: (value:any) => {
                        //truncate
                        value = value.toString();
                        return value.length > 12 ? `${value.substr(0, 10)}...` : value
                    } 
                }
            }];

            let yAxes:any[] = [{
                stacked: [
                    CHART_STYLES.STACKEDAREA, 
                    CHART_STYLES.STACKEDBARS, 
                    CHART_STYLES.STACKEDHBARS,
                    CHART_STYLES.STACKEDPERCENTAREA,
                    CHART_STYLES.STACKEDPERCENTBARS,
                    CHART_STYLES.STACKEDPERCENTHBARS,
                ].includes(chartStyle),
                ticks: {
                    min: getMinDataVal(),
                    max: getMaxDataVal()
                }
            }];

            if ([
                CHART_STYLES.HBARS,
                CHART_STYLES.STACKEDHBARS,
                CHART_STYLES.STACKEDPERCENTHBARS,
                CHART_STYLES.OVERLAPPEDHBARS,
            ].includes(chartStyle)) {
                const t = xAxes;
                xAxes = yAxes;
                yAxes = t;
            }
            
            return {
                legend: {
                    position: 'bottom'
                },
                scales: {
                    xAxes,
                    yAxes
                },
            }
        }
    }, [props.chartStyle, providerData]);

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
                options={options}/>
        </span>
    )
}
export default UIChart