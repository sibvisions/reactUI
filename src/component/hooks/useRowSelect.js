import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';

function useRowSelect(columnName, init, id="no", dataProvider) {
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

        const sub2 = con.contentStore.fetchCompleted.subscribe(fetchResponse => {
            if (fetchResponse.dataProvider === dataProvider) {
                let fetchedData = {};
                for (let fetchRecord of fetchResponse.records) {
                    console.log(con.contentStore.storedData.get(dataProvider).records.find(record => record[0] === fetchRecord[0]))
                }
                for (let i = 0; i < fetchResponse.columnNames.length; i++) {
                    if (fetchResponse.records.length > 0) {
                        fetchedData[fetchResponse.columnNames[i]] = fetchResponse.records[0][i];
                    }
                }
                if (fetchedData[columnName]) {
                    editColumn(fetchedData[columnName])
                }
            }
        })

        return function cleanUp(){
            sub.unsubscribe();
            sub2.unsubscribe();
        }
    });
    return [selectedColumn , editColumn];
}
export default useRowSelect;