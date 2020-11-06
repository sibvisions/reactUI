import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import './UIEditorLinked.scss'
import { AutoComplete } from 'primereact/autocomplete';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { createFetchRequest, createFilterRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import useDataProviderData from "../../zhooks/useDataProviderData";
import * as _ from 'underscore'
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";

interface ICellEditorLinked extends ICellEditor{
    linkReference: {
        referencedDataBook: string
        columnNames: string[]
        referencedColumnNames: string[]
    }
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>

    }
    clearColumns:Array<string>
    preferredEditorMode?: number
}

export interface IEditorLinked extends IEditor{
    cellEditor?: ICellEditorLinked
}

const UIEditorLinked: FC<IEditorLinked> = (baseProps) => {

    const inputRef = useRef(null)
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const [providedData] = useDataProviderData(baseProps.id, props.cellEditor?.linkReference.referencedDataBook||"");
    const lastValue = useRef<any>();

    const [text, setText] = useState(selectedRow)
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(100);
    const {onLoadCallback, id} = baseProps;
    const alignments = checkCellEditorAlignments(props);

    const handleInput = () => {
        const newVal:any = {}
        const foundData = providedData.filter(data => {
            if (props.cellEditor) {
                const refColNames = props.cellEditor.linkReference.referencedColumnNames
                const colNames = props.cellEditor.linkReference.columnNames
                const index = colNames.findIndex(col => col === props.columnName)
                if (typeof text === "string") {
                    return data[refColNames[index]].toLowerCase().includes(text.toLowerCase())
                }
                else if (typeof text === "object" && text !== null) {
                    return data[refColNames[index]] === text[colNames[index]]
                }
            }
            return false
        });
        if (!text) {
            onBlurCallback(baseProps, null, lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, null, lastValue.current, context.server) : null);
        }
        else if (foundData.length === 1) {                
            if (props.cellEditor) {
                if (props.cellEditor.linkReference.columnNames.length > 1) {
                    for (let i = 0; i < Object.values(foundData[0]).length; i++) {
                        newVal[props.cellEditor.linkReference.columnNames[i]] = Object.values(foundData[0])[i];                    }
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, newVal, lastValue.current, context.server) : null);
                }
                else
                    onBlurCallback(baseProps, text, lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text, lastValue.current, context.server) : null);
            }
                
                
        }
        else {
            setText(lastValue.current)
        }
    }

    useEffect(() => {
        if (inputRef.current) {
            //@ts-ignore
            inputRef.current.inputEl.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleInput();
                }
            }
        }
    })

    useEffect(() => {
        return () => {
            if (props.id === "") {
                if (text !== null)
                onBlurCallback(baseProps, text ? text[props.columnName] : null, lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text ? text : null, lastValue.current, context.server) : null);
            }
        }
    },[text, baseProps, context.server, props.cellEditor, props.columnName, props.dataRow, props.id, props.name]);

    useLayoutEffect(() => {
        const autoRef:any = inputRef.current

        const addBoxShadow = (container:HTMLElement) => {
            container.style.setProperty('box-shadow', '0 0 0 0.2rem #8dcdff');
        }

        const removeBoxShadow = (container:HTMLElement) => {
            container.style.removeProperty('box-shadow');
        }

        const setFocus = (inputEl:HTMLElement, btn:HTMLElement, container:HTMLElement) => {
            inputEl.addEventListener("focus", () => addBoxShadow(container));
            btn.addEventListener("focus", () => addBoxShadow(container));
            inputEl.addEventListener("blur", () => removeBoxShadow(container));
            btn.addEventListener("blur", () => removeBoxShadow(container));
        }

        const removeFocus = (inputEl:HTMLElement, btn:HTMLElement, container:HTMLElement) => {
            inputEl.removeEventListener("focus", () => addBoxShadow(container));
            btn.removeEventListener("focus", () => addBoxShadow(container));
            inputEl.removeEventListener("blur", () => removeBoxShadow(container));
            btn.removeEventListener("blur", () => removeBoxShadow(container))
        }

        if (autoRef) {
            autoRef.inputEl.style.setProperty('background-color', props.cellEditor_background_);
            autoRef.inputEl.style.setProperty('text-align', alignments.ha);
            autoRef.dropdownButton.element.tabIndex = -1;
            setFocus(autoRef.inputEl, autoRef.dropdownButton.element, autoRef.container);
        }
        return () => {
            if (autoRef.dropdownButton)
                removeFocus(autoRef.inputEl, autoRef.dropdownButton.element, autoRef.container)
        }
    },[props.cellEditor_editable_, props.cellEditor_background_, alignments.ha]);

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.container.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width);
        }
    },[onLoadCallback, id]);

    const suggestionData = useMemo(() => {
        return providedData ? providedData.slice(firstRow, lastRow) : []
    }, [providedData, firstRow, lastRow])

    useEffect(() => {
        let blockFetch:boolean = false;
        const handleScroll = (elem:HTMLElement) => {
            if (elem) {
                elem.onscroll = _.throttle(() => {
                    let currFirstItem = elem.scrollTop / elem.children[0].children[0].getBoundingClientRect().height;
                    let currLastItem = (elem.scrollTop + elem.offsetHeight) / elem.children[0].children[0].getBoundingClientRect().height;
                    if (currFirstItem < firstRow) {
                        setFirstRow(Math.floor(currFirstItem / 50) * 50);
                        setLastRow(Math.floor(currFirstItem / 50) * 50 + 100);
                        elem.scrollTop = elem.children[0].children[0].getBoundingClientRect().height * (currLastItem - 3);
                    }
                    if (currLastItem > lastRow) {
                        setFirstRow(Math.floor(currLastItem / 100) * 100);
                        setLastRow(Math.ceil(currLastItem / 100) * 100);
                        elem.scrollTop = elem.children[0].children[0].getBoundingClientRect().height * (currFirstItem + 3)
                    }
                    if (!blockFetch && providedData.length < (firstRow+400) && !context.contentStore.dataProviderFetched.get(props.cellEditor?.linkReference.referencedDataBook || "")) {
                        blockFetch = true;
                        const fetchReq = createFetchRequest();
                        fetchReq.dataProvider = props.cellEditor?.linkReference.referencedDataBook;
                        fetchReq.fromRow = providedData.length;
                        fetchReq.rowCount = 400;
                        context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
                    }
                }, 100);
            }
        }
        setTimeout(() => {
            handleScroll(document.getElementsByClassName("p-autocomplete-panel")[0] as HTMLElement)
        },100);
    }, [context, props, providedData, firstRow, lastRow])

    useLayoutEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    let itemsList:HTMLCollection = document.getElementsByClassName("p-autocomplete-item");
                    for (let i = 0; i < itemsList.length; i++) {
                        //@ts-ignore
                        itemsList[i].style.top = (autoPanel.children[0].children[0].getBoundingClientRect().height * firstRow)+'px'
                    }
                }
            }, 0)
        }
    }, [firstRow, lastRow])
    
    useLayoutEffect(() => {
        if (providedData.length)
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    //@ts-ignore
                    if (autoPanel.children[0].children[0]) {
                        //@ts-ignore
                        autoPanel.children[0].style.height = (providedData.length * (autoPanel.children[0].children[0].getBoundingClientRect().height + 6.864))+'px';
                    }
                }
            }, 0);
        }
    });

    const buildSuggestions = (response:any) => {
        let suggestions:any = []
        if (response.length > 0) {
            response.forEach((record:any) => {
                let text = ""
                if (props.cellEditor)
                    text = props.cellEditor.columnView ? record[props.cellEditor.columnView.columnNames[0]] : record[props.cellEditor?.linkReference.referencedColumnNames[0]]
                suggestions.push(text)
            });
        }
        return suggestions
    }

    const onInputChange = (event:any) => {
        context.contentStore.clearDataFromProvider(props.cellEditor?.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor?.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = event.query;
        context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }

    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    }, [selectedRow])

    return (
        <AutoComplete
            autoFocus={true}
            appendTo={document.body}
            ref={inputRef}
            className="jvxEditorLinked"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            disabled={!props.cellEditor_editable_}
            dropdown
            //field={props.columnName}
            completeMethod={onInputChange}
            suggestions={buildSuggestions(suggestionData)}
            value={text}
            onChange={event => {
                setText(event.target.value)
            }}
            onBlur={() => {
                handleInput();
            }}/>
    )
}
export default UIEditorLinked