// API docs for ChartJS Version used in Prime React - https://www.chartjs.org/docs/2.7.3/
// https://github.com/chartjs/Chart.js/issues/5224

/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** 3rd Party imports */
import {Chart} from 'primereact/chart';

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";
import useDataProviderData from "../zhooks/useDataProviderData";
import { jvxContext } from "../../jvxProvider";

/** Interface for Chartproperties sent by server */
export interface IChart extends BaseComponent {
    chartStyle: number
    dataBook: string
    xColumnName: string
    xColumnLabel: string
    yColumnNames: string[]
    yColumnLabels: string[]
    xAxisTitle: string
    yAxisTitle: string
    data: Array<Array<any>>
    title: string
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

const pointStyles = [
    'rect',
    'circle',
    'triangle',
    'star',
    'cross',
    'dash',
    'rectRot',
    'crossRot',
    'line',
    'rectRounded',
]

function getPointStyle(idx: number) {
    return pointStyles[idx % pointStyles.length];
}


const colors = [
    '#ff000080',
    '#0000ff80',
    '#00ff0080',
    '#ffff0080',
    '#ff00ff80',
    '#00ffff80',
]

function getColor(idx: number) {
    return colors[idx % colors.length];
}

function getLabels(values:any[]) {
    if(values.some(v => typeof v !== 'number' || isNaN(v))) {
        //if one of the labels is not a number return a list of the unique label values
        return [...(new Set(values))]
    } else {
        //if all labels are numbers generate list from min to max
        const from = Math.min(...values) - 1;
        const to = Math.max(...values) + 1;
        const diff = to - from + 1;
        return [...Array(diff).keys()].map(k => from + k)
    }
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

    console.log(props.chartStyle, providerData, props, layoutValue)

    const [data, min, max] = useMemo(() => {
        let { yColumnNames, xColumnName, chartStyle } = props;
        yColumnNames = yColumnNames || [];
        xColumnName = xColumnName || 'X';
        const labels = getLabels(providerData.map(dataRow => dataRow[xColumnName]));

        const percentage = [
            CHART_STYLES.STACKEDPERCENTAREA, 
            CHART_STYLES.STACKEDPERCENTBARS, 
            CHART_STYLES.STACKEDPERCENTHBARS
        ].includes(chartStyle);

        const stacked = [
            CHART_STYLES.STACKEDAREA, 
            CHART_STYLES.STACKEDBARS, 
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTAREA,
            CHART_STYLES.STACKEDPERCENTBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
        ].includes(chartStyle);

        const horizontal = [
            CHART_STYLES.HBARS,
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
            CHART_STYLES.OVERLAPPEDHBARS,
        ].includes(chartStyle);

        let data:number[][] = yColumnNames.map((name) => {
            return providerData.reduce<number[]>((agg, dataRow) => { 
                const lidx = labels.indexOf(dataRow[xColumnName]);
                agg[lidx] = (agg[lidx] || 0) + dataRow[name]; 
                return agg; 
            }, [])
        })

        const sum = data.reduce((agg, d) => {
            d.forEach((v, idx) => agg[idx] = (agg[idx] || 0) + v)
            return agg;
        }, []);

        let min = 0;
        let max = 100;
        if (percentage) {
            data = data.map(d => d.map((v, idx) => 100 * v / sum[idx]))
        } else {
            min = Math.min(0, ...data.reduce((agg, d) => {d.forEach((v, idx) => stacked ? agg[idx] = sum[idx] : agg[idx] = Math.min(agg[idx] || 0, v || 0)); return agg;}, []).filter(Boolean));
            max = Math.max(1, ...data.reduce((agg, d) => {d.forEach((v, idx) => stacked ? agg[idx] = sum[idx] : agg[idx] = Math.max(agg[idx] || 0, v || 0)); return agg;}, []).filter(Boolean)) + 1;    
        }

        if (horizontal) {
            data.forEach(d => {
                d.reverse();
                d.unshift(0);
            });
        }

        return [data, min, max];
    }, [providerData, props.yColumnNames, props.xColumnName, props.chartStyle])

    /**
     * Chart type to be displayed
     * @returns the chart type
     */
    const chartType = useMemo(() => {
        switch (props.chartStyle) {
            case CHART_STYLES.PIE:
                return "pie";
            case CHART_STYLES.RING: 
                return "doughnut";
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
            case CHART_STYLES.LINES: 
            case CHART_STYLES.AREA: 
            case CHART_STYLES.STEPLINES: 
            case CHART_STYLES.STACKEDAREA: 
            case CHART_STYLES.STACKEDPERCENTAREA: 
            default:
                return "line";
        }
    },[props.chartStyle])

    /**
     * Returns the data of a chart and how it should be displayed
     * @returns the data of a chart and how it should be displayed
     */
    const chartData = useMemo(() => {
        let { chartStyle = CHART_STYLES.LINES, yColumnLabels, yColumnNames, xColumnName } = props;
        yColumnLabels = yColumnLabels || [];
        yColumnNames = yColumnNames || [];
        xColumnName = xColumnName || 'X';

        const overlapped = [
            CHART_STYLES.OVERLAPPEDBARS,
            CHART_STYLES.OVERLAPPEDHBARS,
        ].includes(chartStyle);

        const horizontal = [
            CHART_STYLES.HBARS,
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
            CHART_STYLES.OVERLAPPEDHBARS,
        ].includes(chartStyle);

        const labels = getLabels(providerData.map(dataRow => dataRow[xColumnName]));

        const primeChart = {
            labels: horizontal ? labels.reverse() : labels,
            datasets: yColumnNames.map((name, idx) => {
                const singleColor = getColor(idx);
                const axisID = overlapped ? `axis-${idx}` : "axis-0";
                return {
                    ...(horizontal ? { yAxisID: axisID } : { xAxisID: axisID }),
                    label: yColumnLabels[idx],
                    data: data[idx],
                    backgroundColor: [CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle) ? 
                        [...Array(providerData.length).keys()].map((k, idx) => getColor(idx)) : singleColor,
                    borderColor: ![CHART_STYLES.PIE, CHART_STYLES.RING, CHART_STYLES.AREA, CHART_STYLES.STACKEDAREA].includes(chartStyle) ? singleColor : undefined,
                    borderWidth: 1,
                    fill: [CHART_STYLES.AREA, CHART_STYLES.STACKEDAREA, CHART_STYLES.STACKEDPERCENTAREA].includes(chartStyle) ? 'origin' : false,
                    lineTension: 0,
                    pointStyle: getPointStyle(idx),
                    pointRadius: CHART_STYLES.LINES === chartStyle ? 4 : 0,
                    pointHitRadius: CHART_STYLES.LINES === chartStyle ? 7 : 0,
                    steppedLine: CHART_STYLES.STEPLINES === chartStyle,
                }
            })
        }
        //console.log('charts', primeChart, providerData, xColumnName, yColumnNames);
        return primeChart
    },[providerData, props.chartStyle, props.yColumnLabels]);

    /**
     * Returns options for display mostly for legend and axes
     * @param style - chartstyle pie, bar...
     * @returns options for display
     */
    const options = useMemo(() => {
        const { chartStyle = CHART_STYLES.LINES, xAxisTitle, yAxisTitle, yColumnNames, title: chartTitle } = props;
        
        const percentage = [
            CHART_STYLES.STACKEDPERCENTAREA, 
            CHART_STYLES.STACKEDPERCENTBARS, 
            CHART_STYLES.STACKEDPERCENTHBARS
        ].includes(chartStyle);

        const overlapped = [
            CHART_STYLES.OVERLAPPEDBARS,
            CHART_STYLES.OVERLAPPEDHBARS,
        ].includes(chartStyle);

        const stacked = [
            CHART_STYLES.STACKEDAREA, 
            CHART_STYLES.STACKEDBARS, 
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTAREA,
            CHART_STYLES.STACKEDPERCENTBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
        ].includes(chartStyle);

        const title = {
            display: true,
            text: chartTitle,
        }

        const preferredSize = parseJVxSize(props.preferredSize) || parseJVxSize(props.maximumSize) || {width: 1.3, height: 1};
        const aspectRatio = preferredSize.width / preferredSize.height;

        if ([CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle)) {
            return {
                title,
                aspectRatio,
                legend: {
                    display: false
                }
            }
        } else {
            let xAxes:any[] = (overlapped ? yColumnNames : ["x"]).map((v, idx) => ({
                id: `axis-${idx}`,
                display: !idx,
                scaleLabel: {
                    display: true,
                    labelString: xAxisTitle,
                },
                stacked,
                ticks: {
                    callback: (value:any) => {
                        //truncate
                        value = value.toString();
                        return value.length > 12 ? `${value.substr(0, 10)}...` : value
                    } 
                },
                //apparently bar chart defaults are only set correctly for the first axis
                ...(!idx ? {
                    type: 'category',
                    barPercentage: 0.9,
                    categoryPercentage: 0.8,
                    gridLines: {
                      offsetGridLines: false
                    },
                    offset: false
                } : {}),
            }));

            let yAxes:any[] = [{
                scaleLabel: {
                    display: true,
                    labelString: yAxisTitle,
                },
                stacked,
                ticks: {
                    min,
                    max,
                    ...(percentage ? {callback: (value:any) => `${value}%`} : {})
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
                title,
                aspectRatio,
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
        if (chartRef.current) {
            sendOnLoadCallback(
                id, 
                parseJVxSize(props.preferredSize), 
                parseJVxSize(props.maximumSize), 
                parseJVxSize(props.minimumSize), 
                chartRef.current, 
                onLoadCallback
            )
        }
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