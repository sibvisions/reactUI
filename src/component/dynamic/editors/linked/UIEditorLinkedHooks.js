import React, { useContext } from 'react';
import { RefContext } from '../../../helper/Context';
import './UIEditorLinked.scss'

// prime
import { AutoComplete } from 'primereact/autocomplete';

// hooks
import useFetchListen from "../../../hooks/useFetchListen";
import useRowSelect from '../../../hooks/useRowSelect';

function UIEditorLinkedHooks(props){
    const [fetchedData] = useFetchListen(props.cellEditor.linkReference.dataProvider);
    const [selectedRow, editProperty] = useRowSelect();
    const con = useContext(RefContext)

    function buildSuggestions(response= {records: []}){
        let suggestions= []
        response.records.forEach(record => {
            let element = {};
            record.forEach((data, index) => {
                if(data !== null) element[props.cellEditor.clearColumns[index]] = data
            });
            suggestions.push(element);
        });
        return suggestions
    }

    function onInputChange(event){
        con.serverComm.fetchFilterdData(
            props.cellEditor.linkReference.dataProvider,
            event.query,
            props.name);
    }

    return (
        <AutoComplete
            appendTo={document.body}
            id={props.id}
            style={props.layoutStyle}

            dropdown={true}
            completeMethod={onInputChange}
        
            suggestions={buildSuggestions(fetchedData)}

            value={selectedRow[props.columnName]}
            field={props.columnName}

            onChange={e => editProperty(e.target.value[props.columnName], props.columnName)}
        />
    );
}
export default UIEditorLinkedHooks