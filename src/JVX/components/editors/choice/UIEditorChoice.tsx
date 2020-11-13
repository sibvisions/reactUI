import React, {FC, useContext, useMemo, useRef} from "react";
import "./UIEditorChoice.scss"
import {ICellEditor, IEditor} from "../IEditor";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import {createSetValuesRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

interface ICellEditorChoice extends ICellEditor{
    allowedValues: Array<string>,
    defaultImageName?: string
    imageNames: Array<string>,
    preferredEditorMode?: number,
    images: Array<string>
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
    const {onLoadCallback, id} = baseProps;


    const validImages = useMemo(() => {
        let mergedValImg:any
        const mergeObject = (keys:Array<string>, values:Array<string>) => {
            let mergedObj:any = {};
            if (keys && values) {
                for (let i = 0; i < keys.length; i++) {
                    mergedObj[keys[i]] = values[i];
                }
            }
            return mergedObj;
        }
        if (id !== "")
            mergedValImg = mergeObject(props.cellEditor.allowedValues, props.cellEditor.imageNames);
        else
            mergedValImg = mergeObject(props.cellEditor.allowedValues, props.cellEditor.images)
        return mergedValImg;
    }, [props.cellEditor.allowedValues, props.cellEditor.imageNames])

    const currentImageValue = useMemo(() => {
        let validImage = "invalid"
        if(selectedRow !== undefined)
            validImage = selectedRow
        else{
            for(let value in validImages){
                if(validImages[value] === props.cellEditor.defaultImageName){
                    validImage = value;
                    break;
                }
            }
        }
        return validImage;
    }, [selectedRow, validImages])

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
        const setValReq = createSetValuesRequest();
        setValReq.componentId = props.name;
        setValReq.columnNames = [props.columnName];
        setValReq.dataProvider = props.dataRow;

        const index = props.cellEditor.allowedValues.indexOf(currentImageValue)

        if(props.cellEditor.allowedValues.length > index+1)
            setValReq.values = [props.cellEditor.allowedValues[index+1]];
        else
            setValReq.values = [props.cellEditor.allowedValues[0]];
        context.server.sendRequest(setValReq, REQUEST_ENDPOINTS.SET_VALUES);

    }

    return (
        <span className="jvxEditorChoice" style={{...layoutValue.get(props.id)||baseProps.editorStyle, justifyContent: alignments.ha, alignItems: alignments.va}}>
            <img
                ref={btnRef}
                className="jvxEditorChoice-img"
                alt=""
                onClick={handleClick}
                src={context.server.RESOURCE_URL + validImages[currentImageValue]}
                onLoad={onChoiceLoaded}
            />
        </span>
    )
}
export default UIEditorChoice