import React, {FC, useMemo} from "react";
import useDataProviderData from "../../JVX/components/zhooks/useDataProviderData";
import { Chart } from 'primereact/chart';

const CustomChartScreen: FC = () => {
    const [data] = useDataProviderData("Cha-OL", "old", "JVxMobileDemo/Cha-OL/chartData#0");


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