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

// API docs for ChartJS Version used in Prime React - https://www.chartjs.org/docs/2.7.3/
// https://github.com/chartjs/Chart.js/issues/5224

import React, { FC, useLayoutEffect, useMemo } from "react";
import { Chart } from 'primereact/chart';
import 'chartjs-adapter-date-fns';
import tinycolor from "tinycolor2";
import IBaseComponent from "../../util/types/IBaseComponent";
import getSettingsFromCSSVar from "../../util/html-util/GetSettingsFromCSSVar";
import useDataProviderData from "../../hooks/data-hooks/useDataProviderData";
import useRowSelect from "../../hooks/data-hooks/useRowSelect";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import useFetchMissingData from "../../hooks/data-hooks/useFetchMissingData";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { translation } from "../../util/other-util/Translation";
import * as _ from 'underscore';
import { createSelectRowRequest } from "../../factories/RequestFactory";
import useMetaData from "../../hooks/data-hooks/useMetaData";
import MetaDataResponse from "../../response/data/MetaDataResponse";
import { showTopBar } from "../topbar/TopBar";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { IComponentConstants } from "../BaseComponent";
import Dimension from "../../util/types/Dimension";
import CELLEDITOR_CLASSNAMES from "../editors/CELLEDITOR_CLASSNAMES";
import { getGlobalLocale } from "../../util/other-util/GetDateLocale";

/** Interface for Chartproperties sent by server */
export interface IChart extends IBaseComponent, IComponentConstants {
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

/**
 * Retrieves the point style for the given index. 
 * The point styles are returned in the order of the point styles list and start from the beginning if the end of the list is reached.
 * @param idx - The index to get the point style for
 * @param points - A custom list of point styles to use for retrieval
 * @returns 
 */
function getPointStyle(idx: number, points?: string[]) {
    const p = points || pointStyles;
    return p[idx % p.length];
}

const colors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)'
]

let pieColorHelper = 0;

/**
 * Retrieves the color for the given index. 
 * The colors are returned in the order of the colors list and start from the beginning if the end of the list is reached.
 * @param idx - The index to get the color for
 * @param opacity - The opacity of the color
 * @param customColors - A custom list of colors to use for retrieval
 * @returns 
 */
function getColor(idx: number, opacity = 1, customColors?: string[], pie?:boolean) {
    const c = customColors || colors;
    const cv = pie ? c[pieColorHelper] : c[idx % c.length];

    if (pie) {
        if (pieColorHelper === c.length - 1) {
            pieColorHelper = 0;
        }
        else {
            pieColorHelper++
        }
    }
    return opacity < 1 ?  tinycolor(cv).setAlpha(opacity).toRgbString() : cv;
}

/**
 * returns true if one or more of the values in the given array are not a number
 * @param values - A list of values to check
 * @returns true if there is a non numeric value in the list
 */
function someNaN(values:any[]) {
    return values && values.some(v => typeof v !== 'number' || isNaN(v));
}

/**
 * Generates a list of axis labels based on the given values.
 * If the given values are all numbers a list of numbers from the minimum to maximum value is generated
 * If some of the values are non numeric a list of unique values is returned
 * @param values - A list of values
 * @param translation - A list of possible translation for non numeric values
 * @returns A list of axis labels for a chart
 */
function getLabels(values:any[], translation?: Map<string,string>, onlyIfNaN: boolean = false) {
    if (values.length) {
        if(someNaN(values)) {
            //if one of the labels is not a number return a list of the unique label values
            const labels = [...(new Set(values))];
            if(translation) {
                return labels.map(l => translation.get(l) || l)
            } else {
                return labels;
            }
        } else {
            if (onlyIfNaN) {
                return null;
            }
            //if all labels are numbers generate list from min to max
            const from = Math.min(...values) - 1;
            const to = Math.max(...values) + 1;
            const diff = to - from + 1;
            return [...Array(diff).keys()].map(k => from + k)
        }
    }
    return [];
}

/**
 * This component displays charts with various styles
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIChart: FC<IChart> = (props) => {
    /** ComponentId of the screen */
    const screenName = props.context.contentStore.getScreenName(props.id, props.dataBook) as string;

    /** The data provided by the databook */
    const [providerData]:any[][] = useDataProviderData(screenName, props.dataBook);

    /** get the currently selected row */
    const [selectedRow] = useRowSelect(screenName, props.dataBook);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The metadata for the given databook */
    const metaData:MetaDataResponse|undefined = useMetaData(screenName, props.dataBook) as MetaDataResponse|undefined

    /** process the providerData to geta usable data list as well as the min & max values */
    const [data, min, max, xmin, xmax] = useMemo(() => {
        let { yColumnNames, xColumnName, chartStyle } = props;
        yColumnNames = yColumnNames || [];
        xColumnName = xColumnName || 'X';
        const row = providerData.map(dataRow => dataRow[xColumnName]);
        const labels = getLabels(row, undefined, true);
        const hasStringLabels = someNaN(row);

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

        const pie = [
            CHART_STYLES.PIE,
            CHART_STYLES.RING,
        ].includes(chartStyle);

        let xmin = Number.MAX_SAFE_INTEGER;
        let xmax = Number.MIN_SAFE_INTEGER;

        let data:{x: number, y:number}[][] = yColumnNames.map(name => {
            //if this is a pie chart and there are multiple y-values 
            //only use the selected row as data or the first one 
            // -> y-values are compared in pie chart
            return (pie && yColumnNames.length > 1 ? selectedRow ? [selectedRow] : providerData.slice(0, 1) : providerData)
            .reduce<{x: number, y: number}[]>((agg, dataRow, idx) => {
                //get the index of the x-value in the labels

                const getLIDX = () => {
                    if (labels) {
                        return labels.indexOf(dataRow[xColumnName])
                    }
                    else {
                        const foundColumnDefinition = metaData?.columns.find(column => column.name === xColumnName);
                        if (foundColumnDefinition) {
                            if (foundColumnDefinition.cellEditor.className === CELLEDITOR_CLASSNAMES.DATE) {
                                return new Date(dataRow[xColumnName]);
                            }
                        }
                        return dataRow[xColumnName];
                    }
                }

                const lidx = getLIDX();
                //use that label index to assign the summed value over all rows at the correct index
                //so that label & value match up in the rendered chart
                //agg[lidx] = (agg[lidx] || 0) + dataRow[name];

                const foundIndex = agg.findIndex(xy => xy ? xy.x === lidx : false);
                if (foundIndex !== -1) {
                    agg[foundIndex] = { x: lidx, y: (agg[foundIndex] ? agg[foundIndex].y || 0 : 0) + parseFloat(dataRow[name]) };
                }
                else {
                    agg[idx] = { x: lidx, y: (agg[idx] ? agg[idx].y || 0 : 0) + parseFloat(dataRow[name]) };
                }
                xmin = Math.min(xmin, lidx); 
                xmax = Math.max(xmax, lidx);
                return agg; 
            }, [])
        })

        //generate the sum of all y-values
        const sum = data.reduce((agg, d) => {
            d.forEach((v, idx) => agg[idx] = {x: v.x, y: (agg[idx] ? agg[idx].y || 0 : 0) + v.y})
            return agg;
        }, []);

        //default min & max are 0-100 for percentage values
        let min = 0;
        let max = 100;

        if(pie) {
            //in a pie or ring chart we only need the total sum 
            const pieSum = sum.reduce((agg, v) => agg + v.y, 0);
            if(data.length > 1) {
                //if there are multiple y-axes sum the values
                data = [data.map(d => d.reduce((agg, v) => {
                    return { x: v.x, y: agg.y + v.y }
                }, { x: 0, y: 0 }))]
            }
            data = data.map(d => d.map(v => {
                return { x: v.x, y: 100 * v.y / pieSum } 
            }))
        } 
        else if (percentage) {
            //convert values to percentages
            data = data.map(d => d.map((v, idx) => {
                return { x: v.x, y: 100 * v.y / sum[idx].y }
            }))
        } 
        else {
            //find the actual minimum and maximum values
            const minReducedArray = data.reduce((agg, d) => {
                d.forEach((v, idx) => stacked ? 
                    agg[idx] = sum[idx] : 
                    agg[idx] = { x: v.x, y: Math.min(agg[idx] ? agg[idx].y || 0 : 0, v.y || 0) }
                ); 
                return agg;
            }, []).filter(Boolean);
            const minArray = minReducedArray.map(xy => xy.y);
            min = Math.min(0, ...minArray);

            const maxReducedArray = data.reduce((agg, d) => {
                d.forEach((v, idx) => stacked ? 
                    agg[idx] = sum[idx] : 
                    agg[idx] = { x: v.x, y: Math.max(agg[idx] ? agg[idx].y || 0 : 0, v.y || 0) }
                ); 
                return agg;
            }, []).filter(Boolean)
            const maxArray = maxReducedArray.map(xy => xy.y);
            max = Math.max(1, ...maxArray) + 1;    
        }

        if (!pie) {
            data = data.map(d => d.reduce<any[]>((agg, v, idx) => {
                agg.push({ x: v.x, y: v.y });
                return agg;
            }, []));
        }

        if (horizontal && !hasStringLabels) {
            //if the chart is horizontal and has no string labels reverese the order
            data.forEach(d => {
                d.reverse();
            });
        }
        
        return [data, min, max, xmin, xmax];
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
            case CHART_STYLES.HBARS: 
            case CHART_STYLES.STACKEDHBARS: 
            case CHART_STYLES.STACKEDPERCENTHBARS: 
            case CHART_STYLES.OVERLAPPEDHBARS: 
                return "bar";
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

        const pie = [
            CHART_STYLES.PIE,
            CHART_STYLES.RING,
        ].includes(chartStyle);

        //get the actual x-values from the provided data
        const rows = providerData.map(dataRow => dataRow[xColumnName]);
        //if pie chart & multiple y-Axes use the y column labels otherwise generate labels based on x-values
        //const labels = pie && yColumnLabels.length > 1 ? yColumnLabels : getLabels(rows, translation);
        const hasStringLabels = someNaN(rows);
        const {colors, points, overlapOpacity} = getSettingsFromCSSVar({
            colors: {
                cssVar: '--chart-colors',
                transform: 'csv'
            },            
            points: {
                cssVar: '--chart-points',
                transform: 'csv'
            },
            overlapOpacity:  {
                cssVar: '--chart-overlap-opacity',
                transform: 'float',
                defaultValue: .5
            }
        }, props.forwardedRef.current);

        const opacity = [
            CHART_STYLES.AREA,
            CHART_STYLES.OVERLAPPEDBARS,
            CHART_STYLES.OVERLAPPEDHBARS
        ].includes(chartStyle) ? overlapOpacity : 1;

        const primeChart = {
            //a dataset per y-Axis unless for a pie chart where we only need a single data set
            datasets: (pie ? ['X'] : yColumnNames).map((name, idx) => {
                const singleColor = getColor(idx, opacity, colors, pie);
                const axisID = overlapped ? `axis-${idx}` : "axis-0";

                return {
                    ...(horizontal ? { yAxisID: axisID, xAxisID: 'caxis-0' } : { xAxisID: axisID, yAxisID: 'caxis-0' }),
                    label: data[idx],
                    data: pie && data[idx] ? data[idx].map(v => v.y) :  data[idx],
                    ...(!pie ? {parsing: {
                        xAxisKey: horizontal ? 'y' : 'x',
                        yAxisKey: horizontal ? 'x' : 'y'
                    }} : {}),
                    backgroundColor: [CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle) ? 
                        [...Array(providerData.length).keys()].map((k, idx2) => data[idx] && data[idx][idx2] ? getColor(idx2, opacity, colors, pie) : undefined) : singleColor,
                    borderColor: ![CHART_STYLES.PIE, CHART_STYLES.RING, CHART_STYLES.AREA, CHART_STYLES.STACKEDAREA].includes(chartStyle) ? singleColor : undefined,
                    borderWidth: 1,
                    fill: [CHART_STYLES.AREA, CHART_STYLES.STACKEDAREA, CHART_STYLES.STACKEDPERCENTAREA].includes(chartStyle) ? 'origin' : false,
                    lineTension: 0,
                    pointStyle: getPointStyle(idx, points),
                    pointRadius: CHART_STYLES.LINES === chartStyle ? 4 : 0,
                    pointHitRadius: 7,
                    stepped: CHART_STYLES.STEPLINES === chartStyle,
                    barPercentage: hasStringLabels && overlapped ? (0.9 - (idx * 0.15)) : 0.9,
                    categoryPercentage: 0.8,
                }
            }),
            labels: yColumnNames
        }
        return primeChart
    },[providerData, props.chartStyle, props.yColumnLabels]);

    /**
     * Returns options for display mostly for legend and axes
     * @param style - chartstyle pie, bar...
     * @returns options for display
     */
    const options = useMemo(() => {
        const { chartStyle = CHART_STYLES.LINES, xAxisTitle, yAxisTitle, yColumnNames, yColumnLabels = [], xColumnName, title: chartTitle } = props;

        const percentage = [
            CHART_STYLES.STACKEDPERCENTAREA, 
            CHART_STYLES.STACKEDPERCENTBARS, 
            CHART_STYLES.STACKEDPERCENTHBARS
        ].includes(chartStyle);

        const pie = [
            CHART_STYLES.PIE,
            CHART_STYLES.RING,
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

        const horizontal = [
            CHART_STYLES.HBARS,
            CHART_STYLES.STACKEDHBARS,
            CHART_STYLES.STACKEDPERCENTHBARS,
            CHART_STYLES.OVERLAPPEDHBARS,
        ].includes(chartStyle);

        const title = {
            display: true,
            text: chartTitle,
        }

        const preferredSize = props.layoutStyle?.height && props.layoutStyle.width ? ({ width: props.layoutStyle.width, height: props.layoutStyle.height } as Dimension) : parsePrefSize(props.preferredSize) || parsePrefSize(props.maximumSize) || {width: 1.3, height: 1};
        const aspectRatio = Math.round(preferredSize.width / preferredSize.height);

        const rows = providerData.map(dataRow => dataRow[xColumnName]);
        const labels = pie && yColumnLabels.length > 1 ? yColumnLabels : getLabels(rows, translation);
        const hasStringLabels = someNaN(providerData.map(dataRow => dataRow[xColumnName]));

        const isDateXColumn = () => {
            return metaData?.columns.find(column => column.name === xColumnName)?.cellEditor.className === CELLEDITOR_CLASSNAMES.DATE;
        }

        const tooltip = {
            callbacks: {
                label: (context: any) => {
                    const { formattedValue, raw } = context;
                    let value = formattedValue;
                    if(pie && !value) {
                        value = raw;
                    }

                    if (pie || percentage) {
                        if (providerData[context.dataIndex] && providerData[context.dataIndex][xColumnName] !== undefined) {
                            return `${providerData[context.dataIndex][xColumnName] + ': ' + parseFloat(value).toFixed(2).replace('.00', '')}%`
                        }
                        else {
                            return `${parseFloat(value).toFixed(2).replace('.00', '')}%`
                        }
                    }
                    else {
                        return formattedValue;
                    }
                }
            }
        }

        if ([CHART_STYLES.PIE, CHART_STYLES.RING].includes(chartStyle)) {
            return {
                aspectRatio,
                plugins: {
                    title,
                    tooltip,
                    legend: {
                        display: false
                    },
                },
            }
        } else {
            const getAxisType = () => {
                if (isDateXColumn()) {
                    return "time";
                }
                else if (hasStringLabels) {
                    return "category";
                }
                return "linear";
            }
            let axes:any[] = (overlapped ? yColumnNames : ["x"]).map((v, idx) => ({
                id: `axis-${idx}`,
                axis: horizontal ? 'y' : 'x',
                display: !idx,
                type: getAxisType(),
                title: {
                    display: true,
                    text: xAxisTitle,
                },
                stacked,
                bounds: "ticks",
                ticks: {
                    callback: (value:any) => {
                        //truncate
                        value = (hasStringLabels ? labels![value] : value.toString()) || '';
                        return value.length > 12 ? `${value.substr(0, 10)}...` : value
                    } 
                },
                offset: hasStringLabels,
                grid: {
                    offset: hasStringLabels
                },
                ...(hasStringLabels ? { labels } : {
                    suggestedMin: xmin,
                    suggestedMax: xmax,
                }),
                ...(isDateXColumn() ? {
                    min: new Date(xmin),
                    max: new Date(xmax),
                    adapters: {
                        date: {
                            locale: getGlobalLocale()
                        }
                    }
                } : {})
            }));

            axes.push({
                id: 'caxis-0',
                type: 'linear',
                axis: horizontal ? 'x' : 'y',
                title: {
                    display: true,
                    text: yAxisTitle,
                },
                stacked,
                min,
                ...(percentage ? { max } : { suggestedMax: max }),
                ticks: {
                    ...(percentage ? {callback: (value:any) => `${value}%`} : {})
                },
            });

            return {
                plugins: {
                    title,
                    tooltip,
                    legend: {
                        position: 'bottom'
                    },
                },
                locale: getGlobalLocale(),
                aspectRatio,
                labels: {
                    usePointStyle: true,
                },
                onClick: (e:any) => {
                    var elementArr = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
                    if (elementArr.length) {
                        const firstPoint = elementArr[0];
                        const label = e.chart.data.labels[firstPoint.datasetIndex];
                        const value = e.chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                        const obj:any = {}
                        obj[label] = value.y;
                        obj[xColumnName] = value.x;
                        const foundData = providerData.find(data => data[label] === obj[label] && data[xColumnName] === obj[xColumnName]);
                        if (foundData) {
                            const selectReq = createSelectRowRequest();
                            selectReq.componentId = props.name;
                            selectReq.dataProvider = props.dataBook;
                            selectReq.filter = {
                                columnNames: metaData?.primaryKeyColumns || [],
                                values: Object.values(_.pick(foundData, metaData?.primaryKeyColumns || []))
                            }
                            selectReq.selectedColumn = label
                            showTopBar(props.context.server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_COLUMN, true), props.context.server.topbar);
                        }

                    }
                },
                scales: {
                    ...axes.reduce((agg, axis) => {
                        agg[axis['id']] = axis;
                        return agg;
                    }, {})
                },
                indexAxis: horizontal ? 'y' : 'x',
            }
        }
    }, [props.chartStyle, providerData, props.layoutStyle?.width, props.layoutStyle?.height, metaData]);

    /** Fetches the data from the databook if the data isn't available */
    useFetchMissingData(screenName, props.dataBook);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
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

    return (
        <span ref={props.forwardedRef} id={props.name} className={concatClassnames("rc-chart", props.styleClassNames)} style={props.layoutStyle} tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            <Chart
                type={chartType}
                data={chartData}
                options={options}
                {...usePopupMenu(props)} />
        </span>
    )
}
export default UIChart