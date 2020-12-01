import {useContext, useEffect, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useRowSelect = (compId:string, dataProvider: string, column?: string) => {

    const context = useContext(jvxContext);
    const currentlySelectedRow = useMemo(() => {
        const sr = context.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider)
        if(column && sr)
            return sr[column];
        else
            return sr;

    }, [context.contentStore, dataProvider, column, compId])
    const [selectedRow, setSelectedRow] = useState<any>(currentlySelectedRow);


    useEffect(() => {
        const onRowSelection = (newRow: any) => {
            if(column && newRow)
                setSelectedRow(newRow[column]);
            else
                setSelectedRow(newRow);
        }
        context.contentStore.subscribeToRowSelection(compId, dataProvider, onRowSelection);
        return () => {
            context.contentStore.unsubscribeFromRowSelection(compId, dataProvider, onRowSelection);
        }
    }, [context.contentStore, dataProvider, column, compId])

    return [selectedRow];
}
export default useRowSelect