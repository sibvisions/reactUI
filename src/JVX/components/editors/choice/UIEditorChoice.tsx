import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import "./UIEditorChoice.scss"
import {ICellEditor, IEditor} from "../IEditor";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {sendSetValues} from "../../util/SendSetValues";

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

    useLayoutEffect(() => {
        if (onLoadCallback && btnRef.current) {
            //@ts-ignore
            const size:Array<DOMRect> = btnRef.current.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width)
        }
    },[onLoadCallback, id]);

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
        //justifyContent: alignments.ha, alignItems: alignments.va add to span style
        <span style={{...layoutValue.get(props.id)||baseProps.style, display: 'inline-flex'}}>
            <img
                ref={btnRef}
                alt=""
                style={{cursor: 'pointer'}}
                onClick={handleClick}
                src={mergedValImg[selectedRow] ? 'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + mergedValImg[selectedRow] : ""}
            />
        </span>
    )
}
export default UIEditorChoice