/** React imports */
import React from "react"

/** 3rd Party imports */
import { format, formatISO, isValid } from 'date-fns'
import { Checkbox } from "primereact/checkbox";

/** Other imports */
import { getBooleanValue, 
         ICellEditorChoice, 
         ICellEditorDate, 
         ICellEditorImage, 
         ICellEditorNumber } from "../editors";
import { createEditor } from "../../factories/UIFactory";
import { getGrouping, getMinimumIntDigits, getScaleDigits } from "../util";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response"

/** 
 * Returns an in-cell editor for the column 
 * @param metaData - the metaData of the CellEditor
 * @param props - properties of the cell
 * @returns in-cell editor for the column
 */
export function displayEditor(metaData:LengthBasedColumnDescription|NumericColumnDescription|undefined, props:any) {
    let editor = <div>{props.cellData}</div>
    if (metaData) {
        editor = createEditor({
            ...metaData,
            name: props.name,
            dataRow: props.dataProvider,
            columnName: props.colName,
            id: "",
            cellEditor_editable_: true,
            editorStyle: {width: "100%", height: "100%"},
            autoFocus: true
        }) || editor;
    }
    return editor
}

/** 
 * Returns properly rendered values for cells based on their CellEditors
 * @param metaData - the metaData of the CellEditor
 * @param cellData - the current value of the cell
 * @param resource - the resource string to receive images from the server
 * @param locale - the current locale
 * @returns properly rendered values for cells based on their CellEditors
 */
export function cellRenderer(metaData:LengthBasedColumnDescription|NumericColumnDescription|undefined, cellData:any, resource:string, locale:string, stateFunc:Function) {
    if (cellData !== undefined) {
        if (metaData && metaData.cellEditor) {
            /** If the cell is a ChoiceCellEditor get the index of the value in metaData and return the corresponding image */
            if (metaData.cellEditor.className === "ChoiceCellEditor") {
                const castedCellEditor = metaData.cellEditor as ICellEditorChoice;
                const cellIndex = castedCellEditor.allowedValues.indexOf(cellData);
                if (castedCellEditor.imageNames && cellIndex !== undefined)
                    return <img
                        className="rc-editor-choice-img"
                        alt="choice" src={resource + castedCellEditor.imageNames[cellIndex]}
                        onClick={() => stateFunc()}
                        onLoad={(e) => {
                            e.currentTarget.style.setProperty('--choiceMinW', `${e.currentTarget.naturalWidth}px`);
                            e.currentTarget.style.setProperty('--choiceMinH', `${e.currentTarget.naturalHeight}px`);
                        }} />
            }
            /** If the cell is a DateCellEditor use date-fns format to return the correct value with the correct format*/
            else if (metaData.cellEditor.className === "DateCellEditor") {
                const castedCellEditor = metaData.cellEditor as ICellEditorDate;
                if (isValid(cellData))
                    return castedCellEditor.dateFormat ? format(cellData, castedCellEditor.dateFormat) : formatISO(cellData);
                else
                    return null;
            }
            /** If the cell is a Password cell, return the text replaced with password dots */
            else if (metaData.cellEditor.className === "TextCellEditor" && metaData.cellEditor.contentType === "text/plain;password") {
                if (cellData !== null)
                    return '\u25CF'.repeat(cellData.length);
                else
                    return null
            }
            /** If the cell is an image, get the image from the server decode it and return it */
            else if (metaData.cellEditor.className === "ImageViewer") {
                const castedCellEditor = metaData.cellEditor as ICellEditorImage
                return <img className="rc-table-image" src={cellData ? "data:image/jpeg;base64," + cellData : resource + castedCellEditor.defaultImageName} alt="could not be loaded"/>
            }
            /** If the cell is a NumberCellEditor format it accordingly */
            else if (metaData.cellEditor.className === "NumberCellEditor") {
                const castedMetaData = metaData as NumericColumnDescription
                const castedCellEditor = metaData.cellEditor as ICellEditorNumber
                if (cellData === null)
                    return null
                return Intl.NumberFormat(locale, 
                    {
                        useGrouping: getGrouping(castedCellEditor.numberFormat),
                        minimumIntegerDigits: getMinimumIntDigits(castedCellEditor.numberFormat),
                        minimumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).minScale,
                        maximumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).maxScale
                    }).format(cellData);
            }
            else if (metaData.cellEditor.className === "CheckBoxCellEditor") {
                return <span onClick={() => stateFunc()}>
                    <Checkbox checked={getBooleanValue(cellData)} />
                </span>
                
            }
            else {
                return cellData;
            }
                
        }
    }
    /** If there is no cellData (null) leave cell empty */
    else
        return null
}