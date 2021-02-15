/** React imports */
import React, {FC, useMemo} from "react";

/** 3rd Party imports */
import {Chart} from 'primereact/chart';

/** Hook imports */
import useDataProviderData from "../../JVX/components/zhooks/useDataProviderData";


/**
 * This component is an example of a replacescreen
 */
const CustomChartScreen: FC = () => {
    /** Data received by Dataproviderhook */
    const [data] = useDataProviderData("Cha-OL", "old", "JVxMobileDemo/Cha-OL/chartData#0");

    /**
     * Builds the chart-object based on data of dataprovider
     * @returns chart-object to present chart
     */
    const chartData = useMemo(() => {
        const labels = data.map(point => point.COUNTRY);
        const chartData = data.map(point => point.LITRES)
        const primeChart = {
            labels: labels,
            datasets: [
                {
                    data: chartData
                }
            ]
        }
        return primeChart;
    }, [data])

    return(
        <div style={{width: "100%", height:"100%"}}>
            <Chart type={"pie"} style={{width:"50%", height:"50%"}} data={chartData} />
        </div>
    )
}
export default CustomChartScreen