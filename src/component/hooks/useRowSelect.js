import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';

function useRowSelect(columnName, init, id="no") {
    const [selectedColumn, editColumn] = useState(init);
    const con = useContext(RefContext);

    useEffect(()=> {
        const sub = con.contentStore.selectedDataRowChange.subscribe(row => {
            const value = row[columnName];
            if(value){
                editColumn(row[columnName]);
            }
            else editColumn("");
            con.contentStore.updateContent([{id: id, initialValue: value || init}]);
        });
        return function cleanUp(){
            sub.unsubscribe();
        }
    });
    return [selectedColumn , editColumn];
}
export default useRowSelect;