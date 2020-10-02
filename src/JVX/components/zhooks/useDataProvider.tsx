import {useContext, useEffect, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useDataProvider = (id: string, dataProvider: string) => {
    const context = useContext(jvxContext);
    const initialData = useMemo(() => {
        return context.contentStore.getData(dataProvider);
    }, [context.contentStore, dataProvider]);
    const [data, setData] = useState<Array<any>>(initialData);

    useEffect(() => {
       context.contentStore.subscribeToDataProviderChange(dataProvider, id, (newData: any) => {
           setData(newData)
       });

       return () => {
           context.contentStore.unsubscribeFromDataProviderChange(id);
       }
    });
    return [data];
}
export default useDataProvider