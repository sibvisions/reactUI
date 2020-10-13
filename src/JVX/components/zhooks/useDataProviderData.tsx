import {useContext, useEffect, useRef, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {of} from "rxjs";
import {createFetchRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";

const useDataProviderData = (id: string, dataProvider: string, offset: number = 30, rowCount: number = 100): [Array<any>, Function]=> {
    const context = useContext(jvxContext);
    const dataRange = useRef(rowCount);
    const [data, setData] = useState<Array<any>>(context.contentStore.getData(dataProvider, 0, rowCount));

    useEffect(() => {
        const onDataChange = () => {
            const a = context.contentStore.getData(dataProvider, dataRange.current, rowCount + dataRange.current)
            setData([...a])
        }
        context.contentStore.subscribeToDataChange(dataProvider,onDataChange);
        return () => {
            context.contentStore.unsubscribeFromDataChange(dataProvider, onDataChange);
        }
    }, [context.contentStore, dataProvider ,rowCount]);


    const getNextOffsetData = () => {
        const newData = context.contentStore.getData(dataProvider, dataRange.current, dataRange.current+offset);
        // console.log(newData)

        if(newData.length !== offset){
            const isAllFetched = context.contentStore.dataProviderFetched.get(dataProvider);
            if(isAllFetched){
                setData(data.slice(offset, data.length).concat(newData));
            } else {
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = dataProvider;
                fetchReq.fromRow = dataRange.current + 1 + newData.length;
                fetchReq.rowCount = rowCount*4;
                context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
            }
        } else {
            setData(data.slice(offset, data.length).concat(newData));
        }
        dataRange.current += newData.length

    }

    const getPreviousOffsetData = () => {

    }


    return [data, getNextOffsetData];
}
export default useDataProviderData