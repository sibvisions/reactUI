import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {Chart} from 'primereact/chart';
import tinycolor from 'tinycolor2';
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";

export interface IChart extends BaseComponent {
    chartStyle: number
    data: Array<Array<any>>
    yColumnLabels: Array<string>
}

enum CHART_STYLES {
    LINES=0,
    AREAS=1,
    BARS=2,
    PIE=3

}

const UIChart: FC<IChart> = (baseProps) => {
    const chartRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IChart>(baseProps.id, baseProps);
    const {onLoadCallback, id} = baseProps;

    const chartType = useMemo(() => {
        switch (props.chartStyle) {
            case CHART_STYLES.LINES: case CHART_STYLES.AREAS: return "line";
            case CHART_STYLES.BARS: return "bar";
            default: return "pie"
        }
    },[props.chartStyle])

    const chartData = useMemo(() => {
        const singleColor = tinycolor.random().toHexString();
        const primeChart = {
            labels: props.data.map(dataRow => dataRow[1]),
            datasets: [
                {
                    label: props.yColumnLabels[0],
                    data: props.data.map(dataRow => dataRow[0]),
                    backgroundColor: props.chartStyle === CHART_STYLES.PIE ? props.data.map(dataRow => tinycolor.random().toHexString()): singleColor,
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