import React from "react"
import { IEditorChoice } from "../editors/choice/UIEditorChoice";
import { IEditorDate } from "../editors/date/UIEditorDate";
import { IEditorImage } from "../editors/image/UIEditorImage";
import { IEditor } from "../editors/IEditor";
import { parseDateFormatTable } from "../util/ParseDateFormats";
import moment from "moment";
import { createEditor } from "../../factories/UIFactory";

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

export function cellRenderer(metaData:IEditor|undefined, cellData:any, resource:string) {
    if (cellData !== undefined) {
        if (metaData && metaData.cellEditor) {
            if (metaData.cellEditor.className === "ChoiceCellEditor") {
                const castedColumn = metaData as IEditorChoice;
                const cellIndex = castedColumn.cellEditor.allowedValues.indexOf(cellData);
                if (castedColumn.cellEditor.imageNames && cellIndex !== undefined)
                    return <img className="rc-editor-choice-img" alt="choice" src={resource + castedColumn.cellEditor.imageNames[cellIndex]}/>
            }
            else if (metaData.cellEditor.className === "DateCellEditor") {
                const castedColumn = metaData as IEditorDate;
                const formattedDate = moment(cellData).format(parseDateFormatTable(castedColumn.cellEditor.dateFormat, cellData));
                if (formattedDate !== "Invalid date")
                    return formattedDate;
                else
                    return null;
            }
            else if (metaData.cellEditor.className === "TextCellEditor" && metaData.cellEditor.contentType === "text/plain;password") {
                if (cellData !== null)
                    return '\u25CF'.repeat(cellData.length);
                else
                    return null
            }
            else if (metaData.cellEditor.className === "ImageCellEditor") {
                const castedColumn = metaData as IEditorImage
                return <img className="rc-table-image" src={cellData ? "data:image/jpeg;base64," + cellData : resource + castedColumn.cellEditor.defaultImageName} alt="could not be loaded"/>
            }
            else
                return cellData;
        }
    }
    else
        return null
}