/** React imports */
import React, {FC, useContext, useMemo, useRef} from "react";

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";

/** Other imports */
import {ICellEditor, IEditor} from "../IEditor";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import { getAlignments } from "../../compprops/GetAlignments";
import {createSetValuesRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import { parseJVxSize } from "../../util/parseJVxSize";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { getEditorCompId } from "../../util/GetEditorCompId";

/** Interface for cellEditor property of ChoiceCellEditor */
interface ICellEditorChoice extends ICellEditor{
    allowedValues: Array<string>,
    defaultImageName?: string
    imageNames: Array<string>,
    preferredEditorMode?: number,
}

/** Interface for ChoiceCellEditor */
export interface IEditorChoice extends IEditor{
    cellEditor: ICellEditorChoice
}

/**
 * The ChoiceCellEditor displays images sent by the server which change value by 
 * being clicked different images then will be displayed and the value in the databook will be changed
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorChoice: FC<IEditorChoice> = (baseProps) => {
    /** Reference for the image */
    const imgRef = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorChoice>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Alignments for CellEditor */
    const alignments = getAlignments(props);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /**
     * Returns an object of the allowed values as key and the corresponding image as value
     * @returns an object of the allowed values as key and the corresponding image as value
     */
    const validImages = useMemo(() => {
        let mergedValImg:any
        /**
         * Returns a merged object of two arrays keys for the object are taken from the first array values form the second
         * @param keys - the array which should represent the keys of the merged object
         * @param values - the array which should represent the values of the merged object
         * @returns merged object of two arrays
         */
        const mergeObject = (keys:Array<string>, values:Array<string>) => {
            let mergedObj:any = {};
            if (keys && values) {
                for (let i = 0; i < keys.length; i++) {
                    mergedObj[keys[i]] = values[i];
                }
            }
            return mergedObj;
        }
            mergedValImg = mergeObject(props.cellEditor.allowedValues, props.cellEditor.imageNames);
        return mergedValImg;
    }, [props.cellEditor.allowedValues, props.cellEditor.imageNames])

    /**
     * Returns the current image value based on the selectedRow if there is no row selected check for a defaultimage else invalid
     * @returns current image based on selectedRow
     */
    const currentImageValue = useMemo(() => {
        let validImage = "invalid";
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
    }, [selectedRow, validImages, props.cellEditor.defaultImageName])

    /**
     * When the image is loaded, measure the image and then report its preferred-, minimum-, maximum and measured-size to the layout
     * @param event - image load event
     */
    const onChoiceLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Size = {width: 0, height: 0}
        if(props.preferredSize){
            const parsedSize = parseJVxSize(props.preferredSize) as Size
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        }
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }
        if(onLoadCallback){
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    /**
     * When the ChoiceCellEditor is clicked, send a setValuesRequest to the server
     */
    const handleClick = () => {
        const setValReq = createSetValuesRequest();
        setValReq.componentId = props.name;
        setValReq.columnNames = [props.columnName];
        setValReq.dataProvider = props.dataRow;

        /** Get the index of the current image */
        const index = props.cellEditor.allowedValues.indexOf(currentImageValue)

        /** If the index is not the last value in allowedValues, set to the next value */
        if(props.cellEditor.allowedValues.length > index+1)
            setValReq.values = [props.cellEditor.allowedValues[index+1]];
        /** If the index is the last value, set to the first value of allowedValues */
        else
            setValReq.values = [props.cellEditor.allowedValues[0]];
        context.server.sendRequest(setValReq, REQUEST_ENDPOINTS.SET_VALUES);

    }
    
    return (
        <span className="rc-editor-choice" style={{...layoutValue.get(props.id)||baseProps.editorStyle, justifyContent: alignments.ha, alignItems: alignments.va}}>
            <img
                ref={imgRef}
                className="rc-editor-choice-img"
                alt=""
                onClick={handleClick}
                src={context.server.RESOURCE_URL + validImages[currentImageValue]}
                onLoad={onChoiceLoaded}
                onError={onChoiceLoaded}
            />
        </span>
    )
}
export default UIEditorChoice