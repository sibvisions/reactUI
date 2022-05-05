import React, { FC, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useMouseListener, usePopupMenu } from "../../../hooks";
import { ICellEditor } from "..";
import { getAlignments } from "../../comp-props";
import { createSetValuesRequest } from "../../../factories/RequestFactory";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, handleEnterKey, concatClassnames, checkComponentName, getTabIndex } from "../../../util";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { Tooltip } from "primereact/tooltip";
import { IRCCellEditor } from "../CellEditorWrapper";
import { REQUEST_KEYWORDS } from "../../../request";

/** Interface for cellEditor property of ChoiceCellEditor */
export interface ICellEditorChoice extends ICellEditor {
    allowedValues: Array<string|boolean>,
    defaultImageName?: string
    imageNames: Array<string>,
}

/** Interface for ChoiceCellEditor */
export interface IEditorChoice extends IRCCellEditor {
    cellEditor: ICellEditorChoice
}

/**
 * The ChoiceCellEditor displays images sent by the server which change value by 
 * being clicked different images then will be displayed and the value in the databook will be changed
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorChoice: FC<IEditorChoice> = (props) => {
    /** Reference for the image */
    const imgRef = useRef<HTMLImageElement>(null);

    /** Reference for the wrapper element */
    const wrapRef = useRef<HTMLSpanElement>(null);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Returns the given value as string */
    const getValAsString = useCallback((val) => val === null ? "null" : val.toString(), [])

    /** Check if the ChoiceCellEditor only accepts two values */
    const viableAriaPressed = props.cellEditor.allowedValues.length === 2 && props.cellEditor.allowedValues.some(val => ['y', 'yes', 'true'].indexOf(getValAsString(val).toLowerCase()) !== -1);

    useLayoutEffect(() => {
        if (props.isCellEditor && wrapRef.current) {
            if (props.cellFormatting && props.colIndex !== undefined && props.cellFormatting[props.colIndex]) {
                if (props.cellFormatting[props.colIndex].background) {
                    (wrapRef.current.parentElement as HTMLElement).style.background = props.cellFormatting[props.colIndex].background as string
                }
            }
        }
    }, [props.cellFormatting])

    /**
     * Returns an object of the allowed values as key and the corresponding image as value
     */
    const validImages = useMemo(() => {
        let mergedValImg:any
        /**
         * Returns a merged object of two arrays keys for the object are taken from the first array values form the second
         * @param keys - the array which should represent the keys of the merged object
         * @param values - the array which should represent the values of the merged object
         * @returns merged object of two arrays
         */
        const mergeObject = (keys:Array<string|boolean>, values:Array<string>) => {
            let mergedObj:any = {};
            if (keys && values) {
                for (let i = 0; i < keys.length; i++) {
                    mergedObj[getValAsString(keys[i])] = values[i];
                }
            }
            return mergedObj;
        }
        mergedValImg = mergeObject(props.cellEditor.allowedValues, props.cellEditor.imageNames);
        return mergedValImg;
    }, [props.cellEditor.allowedValues, props.cellEditor.imageNames])

    /**
     * Returns the current image value based on the props.selectedRow if there is no row selected check for a defaultimage else invalid
     */
    const currentImageValue = useMemo(() => {
        let validImage = "invalid";
        if(props.selectedRow !== undefined && props.cellEditor.allowedValues.includes(props.selectedRow.data)) {
            validImage = props.selectedRow.data
        }
        else if (props.cellEditor.defaultImageName !== undefined) {
            validImage = props.cellEditor.defaultImageName;
        }
        return validImage;
    }, [props.selectedRow, validImages, props.cellEditor.defaultImageName, props.cellEditor.allowedValues])

    /**
     * When the image is loaded, measure the image and then report its preferred-, minimum-, maximum and measured-size to the layout
     * @param event - image load event
     */
    const onChoiceLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Dimension = {width: 0, height: 0}
        if(props.preferredSize){
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        }
        else {
            prefSize.height = event.currentTarget.naturalHeight;
            prefSize.width = event.currentTarget.naturalWidth;
        }

        if (imgRef.current) {
            imgRef.current.style.setProperty('--choiceMinW', `${event.currentTarget.naturalWidth}px`);
            imgRef.current.style.setProperty('--choiceMinH', `${event.currentTarget.naturalHeight}px`);
        }

        if(onLoadCallback){
            sendOnLoadCallback(id, props.cellEditor.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    /**
     * Send a sendValues request with the next value to the server
     */
    const setNextValue = () => {
        if (!props.isReadOnly) {
            const setValReq = createSetValuesRequest();
            setValReq.componentId = props.name;
            setValReq.columnNames = [props.columnName];
            setValReq.dataProvider = props.dataRow;
    
            /** Get the index of the current image */
            const index = props.cellEditor.allowedValues.indexOf(currentImageValue)
    
            /** If the index is not the last value in allowedValues, set to the next value */
            if(props.cellEditor.allowedValues.length > index+1) {
                setValReq.values = [props.cellEditor.allowedValues[index+1]];
            }
                
            /** If the index is the last value, set to the first value of allowedValues */
            else {
                setValReq.values = [props.cellEditor.allowedValues[0]];
            }
    
            if (props.rowIndex !== undefined) {
                if (props.filter && props.selectedRow.index !== undefined && props.rowIndex() !== props.selectedRow.index) {
                    setValReq.filter = props.filter()
                }
                setValReq.rowNumber = props.rowIndex()
            }
            showTopBar(props.context.server.sendRequest(setValReq, REQUEST_KEYWORDS.SET_VALUES), props.topbar);
        }
    }
    
    return (
        <span
            ref={wrapRef}
            className={concatClassnames(
                "rc-editor-choice",
                props.columnMetaData?.nullable === false ? "required-field" : "",
                props.focusable === false ? "no-focus-rect" : ""
            )}
            aria-label={props.ariaLabel}
            aria-pressed={viableAriaPressed ? ['y', 'yes', 'true'].indexOf(getValAsString(currentImageValue)) !== -1 : undefined}
            style={props.isCellEditor ?
                { justifyContent: alignments.ha, alignItems: alignments.va }
                :
                { 
                    ...props.layoutStyle, 
                    //...props.cellStyle,
                    justifyContent: alignments.ha, 
                    alignItems: alignments.va,
                }
            }
            onKeyDown={(event) => {
                handleEnterKey(event, event.target, props.name, props.stopCellEditing);
                if (event.key === "Tab" && props.isCellEditor && props.stopCellEditing) {
                    props.stopCellEditing(event)
                }
                if (event.key === " ") {
                    setNextValue()
                }
            }}
            onFocus={(event) => {
                if (props.eventFocusGained) {
                    onFocusGained(props.name, props.context.server);
                }
                else {
                    if (props.isCellEditor) {
                        event.preventDefault();
                    }
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
             >
            <Tooltip target={!props.isCellEditor ? "#" + checkComponentName(props.name) : undefined} />
            <img
                ref={imgRef}
                id={!props.isCellEditor ? checkComponentName(props.name) : undefined}
                className={concatClassnames(
                    "rc-editor-choice-img", 
                    props.isReadOnly ? "choice-read-only" : "",
                    props.style
                )}
                alt=""
                onClick={setNextValue}
                src={currentImageValue !== "invalid" ?
                    props.context.server.RESOURCE_URL + (currentImageValue === props.cellEditor.defaultImageName ?
                        currentImageValue
                        :
                        validImages[currentImageValue])
                    : ""
                }
                onLoad={onChoiceLoaded}
                onError={onChoiceLoaded}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
            />
        </span>
    )
}
export default UIEditorChoice