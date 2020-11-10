import React, {FC, useContext, useMemo, useRef} from "react";
import "./UIEditorChoice.scss"
import {ICellEditor, IEditor} from "../IEditor";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import {createSetValueRequest} from "../../../factories/RequestFactory";

interface ICellEditorChoice extends ICellEditor{
    allowedValues: Array<string>,
    defaultImageName?: string
    imageNames: Array<string>,
    preferredEditorMode?: number
}

export interface IEditorChoice extends IEditor{
    cellEditor: ICellEditorChoice
}

const UIEditorChoice: FC<IEditorChoice> = (baseProps) => {
    const btnRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorChoice>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const alignments = checkCellEditorAlignments(props);



    const validImages = useMemo(() => {
        const mergeObject = (keys:Array<string>, values:Array<string>) => {
            let mergedObj:any = {};
            if (keys && values) {
                for (let i = 0; i < keys.length; i++) {
                    mergedObj[keys[i]] = values[i];
                }
            }
            return mergedObj;
        }
        const mergedValImg = mergeObject(props.cellEditor.allowedValues, props.cellEditor.imageNames);
        return mergedValImg;
    }, [props.cellEditor.allowedValues, props.cellEditor.imageNames])


    const {onLoadCallback, id} = baseProps;

    const onChoiceLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        let height: number, width: number
        if(props.preferredSize){
            const size = props.preferredSize.split(",");
            height = parseInt(size[1]);
            width = parseInt(size[0]);
        }
        else {
            height = event.currentTarget.height;
            width = event.currentTarget.width;
        }
        if(onLoadCallback){
            onLoadCallback(id, height, width);
        }
    }

    const handleClick = () => {
        const getValueOfDefault = () => {
            for(let choice in validImages){
                if(validImages[choice] === props.cellEditor.defaultImageName){
                    return choice;
                }
            }
        }

        let currentRowValue = selectedRow
        if(!currentRowValue)
            currentRowValue = getValueOfDefault() || "NO_VALUE";

        // const indexOfCurrentValue = validImages.

        const setValReq = createSetValueRequest();
        setValReq.componentId = props.name;
        setValReq.value = currentRowValue


        // sendSetValues(props.dataRow, props.name, props.columnName, allowedValues[newIndex], undefined, context.server)
    }

    return (
        <span className="jvxEditorChoice" style={{...layoutValue.get(props.id)||baseProps.editorStyle, justifyContent: alignments.ha, alignItems: alignments.va}}>
            <img
                ref={btnRef}
                className="jvxEditorChoice-img"
                alt=""
                onClick={handleClick}
                src={context.server.RESOURCE_URL + (selectedRow ? validImages[selectedRow]: props.cellEditor.defaultImageName)}
                onLoad={onChoiceLoaded}
            />
        </span>
    )
}
export default UIEditorChoice