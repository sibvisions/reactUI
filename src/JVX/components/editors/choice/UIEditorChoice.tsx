import React, {FC, useContext, useRef} from "react";
import "./UIEditorChoice.scss"
import {ICellEditor, IEditor} from "../IEditor";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {sendSetValues} from "../../util/SendSetValues";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";

interface ICellEditorChoice extends ICellEditor{
    allowedValues?: string,
    images?: string,
    preferredEditorMode?: number
}

export interface IEditorChoice extends IEditor{
    cellEditor?: ICellEditorChoice
}

const UIEditorChoice: FC<IEditorChoice> = (baseProps) => {
    const btnRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorChoice>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const alignments = checkCellEditorAlignments(props);

    const cellEditorMetaData:IEditorChoice|undefined = context.contentStore.dataProviderMetaData.get(props.dataRow)?.columns.find(column => column.name === props.columnName);
    const allowedValues = cellEditorMetaData?.cellEditor?.allowedValues;
    const images = cellEditorMetaData?.cellEditor?.images;

    const mergeObject = (keys:string|undefined, values:string|undefined) => {
        let mergedObj:any = {};
        if (keys && values) {
            for (let i = 0; i < keys.length; i++) {
                mergedObj[keys[i]] = values[i];
            }
        }
        return mergedObj;
    }

    const mergedValImg = mergeObject(allowedValues, images);
    const {onLoadCallback, id} = baseProps;

    const onChoiceLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        let height: number, width: number
        if(props.preferredSize){
            const size = props.preferredSize.split(",");
            height = parseInt(size[1]);
            width = parseInt(size[0]);
        } else {
            height = event.currentTarget.height;
            width = event.currentTarget.width;
        }

        if(onLoadCallback){
            onLoadCallback(id, height, width);
        }
    }

    const handleClick = () => {
        let newIndex = allowedValues?.indexOf(selectedRow);
        if (allowedValues !== undefined && newIndex !== undefined) {
            if (allowedValues[newIndex+1] === undefined) {
                newIndex = 0;
            }
            else {
                newIndex++;
            }
            sendSetValues(props.dataRow, props.name, props.columnName, allowedValues[newIndex], undefined, context)
        }
    }

    return (
        <span style={{...layoutValue.get(props.id)||baseProps.editorStyle, display: 'inline-flex', justifyContent: alignments?.ha ? alignments.ha : 'center', alignItems: alignments?.va ? alignments.va : "center"}}>
            <img
                ref={btnRef}
                alt=""
                style={{cursor: 'pointer'}}
                onClick={handleClick}
                src={mergedValImg[selectedRow] ? context.server.RESOURCE_URL + mergedValImg[selectedRow] : ""}
                onLoad={onChoiceLoaded}
            />
        </span>
    )
}
export default UIEditorChoice