/** React imports */
import React from "react"

/** 3rd Party imports */
import moment from "moment";
import { Checkbox } from "primereact/checkbox";

/** Other imports */
import { IEditor, IEditorChoice, IEditorDate, IEditorImage, IEditorNumber, getBooleanValue } from "../editors";
import { createEditor } from "../../factories/UIFactory";
import { getGrouping, getMinimumIntDigits, getScaleDigits, parseDateFormatTable } from "../util";

/** 
 * Returns an in-cell editor for the column 
 * @param metaData - the metaData of the CellEditor
 * @param props - properties of the cell
 * @returns in-cell editor for the column
 */
export function displayEditor(metaData:IEditor|undefined, props:any) {
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
export function cellRenderer(metaData:IEditor|undefined, cellData:any, resource:string, locale:string, stateFunc:Function) {
    if (cellData !== undefined) {
        if (metaData && metaData.cellEditor) {
            /** If the cell is a ChoiceCellEditor get the index of the value in metaData and return the corresponding image */
            if (metaData.cellEditor.className === "ChoiceCellEditor") {
                const castedColumn = metaData as IEditorChoice;
                const cellIndex = castedColumn.cellEditor.allowedValues.indexOf(cellData);
                if (castedColumn.cellEditor.imageNames && cellIndex !== undefined)
                    return <img
                        className="rc-editor-choice-img"
                        alt="choice" src={resource + castedColumn.cellEditor.imageNames[cellIndex]}
                        onClick={() => stateFunc()}
                        onLoad={(e) => {
                            e.currentTarget.style.setProperty('--choiceMinW', `${e.currentTarget.naturalWidth}px`);
                            e.currentTarget.style.setProperty('--choiceMinH', `${e.currentTarget.naturalHeight}px`);
                        }} />
            }
            /** If the cell is a DateCellEditor use moment to return the correct value with the correct format (parsing Java SimpleDateFormat tokens to moment tokens) */
            else if (metaData.cellEditor.className === "DateCellEditor") {
                const castedColumn = metaData as IEditorDate;
                const formattedDate = moment(cellData).format(parseDateFormatTable(castedColumn.cellEditor.dateFormat, cellData));
                if (formattedDate !== "Invalid date")
                    return formattedDate;
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
                const castedColumn = metaData as IEditorImage
                return <img className="rc-table-image" src={cellData ? "data:image/jpeg;base64," + cellData : resource + castedColumn.cellEditor.defaultImageName} alt="could not be loaded"/>
            }
            /** If the cell is a NumberCellEditor format it accordingly */
            else if (metaData.cellEditor.className === "NumberCellEditor") {
                const castedColumn = metaData as IEditorNumber;
                if (cellData === null)
                    return null
                return Intl.NumberFormat(locale, 
                    {
                        useGrouping: getGrouping(castedColumn.cellEditor.numberFormat),
                        minimumIntegerDigits: getMinimumIntDigits(castedColumn.cellEditor.numberFormat),
                        minimumFractionDigits: getScaleDigits(castedColumn.cellEditor.numberFormat, castedColumn.scale).minScale,
                        maximumFractionDigits: getScaleDigits(castedColumn.cellEditor.numberFormat, castedColumn.scale).maxScale
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