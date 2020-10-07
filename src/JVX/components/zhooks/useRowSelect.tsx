import {useContext, useEffect, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useRowSelect = (dataProvider: string, column?: string) => {

    const context = useContext(jvxContext);
    const currentlySelectedRow = useMemo(() => {
        const sr = context.contentStore.dataProviderSelectedRow.get(dataProvider)
        if(column && sr)
            return sr[column];
        else
            return sr;

    }, [context.contentStore, dataProvider, column])
    const [selectedRow, setSelectedRow] = useState<any>(currentlySelectedRow);


    useEffect(() => {
        const onRowSelection = (newRow: any) => {
            if(column && newRow)
                setSelectedRow(newRow[column]);
            else
                setSelectedRow(newRow);
        }
        context.contentStore.subscribeToRowSelection(dataProvider, onRowSelection);
        return () => {
            context.contentStore.unsubscribeFromRowSelection(dataProvider, onRowSelection);
        }
    }, [context.contentStore, dataProvider, column])

    return [selectedRow];
}
export default useRowSelect