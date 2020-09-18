import React, { useContext, useEffect, useRef, useLayoutEffect } from 'react';
import { RefContext } from '../../../helper/Context';

// prime
import { AutoComplete } from 'primereact/autocomplete';

// hooks
import useFetchListen from "../../../hooks/useFetchListen";
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';

function UIEditorLinked(props){
    const [fetchedData] = useFetchListen(props.cellEditor.linkReference.referencedDataBook);
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "",
                                                      props.id, props.dataRow, props.cellEditor.className);
    const con = useContext(RefContext)
    const autoComRef = useRef();

    useEffect(()=> {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    });

    useLayoutEffect(() => {
        if(autoComRef.current.inputEl){
            const alignments = checkCellEditorAlignments(props);
            autoComRef.current.inputEl.style['background-color'] = props['cellEditor.background'];
            autoComRef.current.inputEl.style['text-align'] = alignments.ha;
        }
    });

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
            props.cellEditor.linkReference.referencedDataBook,
            event.query,
            props.name);
    }

    return (
        <AutoComplete
            appendTo={document.body}
            id={props.id}
            style={props.layoutStyle}
            ref={autoComRef}
            dropdown={true}
            completeMethod={onInputChange}
            suggestions={buildSuggestions(fetchedData)}
            field={props.columnName}
            value={selectedColumn} 
            onChange={event => editColumn(event.target.value)}
        	onBlur={() => {
                if (props.rowId) {
                    if (con.contentStore.selectedRow.get(props.dataRow) === props.rowId - 1) {
                        con.serverComm.setValues(props.name, props.dataRow, props.columnName, selectedColumn[props.columnName])
                    }
                }
                else {
                    con.serverComm.setValues(props.name, props.dataRow, props.columnName, selectedColumn[props.columnName])
                }
            }}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorLinked