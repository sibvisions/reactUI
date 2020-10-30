import React, {CSSProperties, FC, useContext, useEffect, useMemo, useRef} from "react";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "../../layouts/models/ALIGNMENT";
import useProperties from "../../zhooks/useProperties";

interface ICellEditorImage extends ICellEditor{
    defaultImageName: string,
    preserveAspectRatio: boolean
}

export interface IEditorImage extends IEditor{
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

const UIEditorImage: FC<IEditorImage> = (baseProps) => {

    const layoutValue = useContext(LayoutContext);
    const context = useContext(jvxContext);
    const imageRef = useRef<HTMLImageElement>(null);
    const [props] = useProperties<IEditorImage>(baseProps.id, baseProps);

    const {verticalAlignment, horizontalAlignment} = props

    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);

    useEffect(() => {
        if (!props.cellEditor.defaultImageName) {
            let height = 0, width = 0;
            if (props.preferredSize) {
                const size = props.preferredSize.split(',');
                width = parseInt(size[0]);
                height = parseInt(size[1]);
            }
            if (props.onLoadCallback)
                props.onLoadCallback(props.id, height, width)
        }
    },[props.onLoadCallback, props.id])

    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        let height: number, width: number
        if(props.preferredSize){
            const size = props.preferredSize.split(",");
            height = parseInt(size[1]);
            width = parseInt(size[0]);
        } else {
            height = event.currentTarget.height;
            width = event.currentTarget.width;
        }

        if(props.onLoadCallback){
            props.onLoadCallback(props.id, height, width);
        }
    }

    const alignmentCss = useMemo(() => {
        const spanCSS: CSSProperties = {};
        const imgCSS: CSSProperties = {};
        const cellHA = props.cellEditor_horizontalAlignment_
        const cellVA = props.cellEditor_verticalAlignment_

        let ha = horizontalAlignment || cellHA;
        let va = verticalAlignment || cellVA;

        if(ha === HORIZONTAL_ALIGNMENT.LEFT)
            spanCSS.justifyContent = "flex-start";
        else if(ha === HORIZONTAL_ALIGNMENT.CENTER)
            spanCSS.justifyContent = "center";
        else if(ha === HORIZONTAL_ALIGNMENT.RIGHT)
            spanCSS.justifyContent = "flex-end";

        if(va === VERTICAL_ALIGNMENT.TOP)
            spanCSS.alignItems = "flex-start";
        else if(va === VERTICAL_ALIGNMENT.CENTER)
            spanCSS.alignItems = "center";
        else if(va === VERTICAL_ALIGNMENT.BOTTOM)
            spanCSS.alignItems = "flex-end";

        if(va === VERTICAL_ALIGNMENT.STRETCH && ha === HORIZONTAL_ALIGNMENT.STRETCH)
            imgCSS.width = "100%";
        else if(ha === HORIZONTAL_ALIGNMENT.STRETCH) {
            spanCSS.flexFlow = "column";
            spanCSS.justifyContent = spanCSS.alignItems;
            spanCSS.alignItems = undefined;
        }
        return {span: spanCSS, img: imgCSS};
    }, [verticalAlignment, horizontalAlignment])

    return(
        <span style={{position:"absolute", ...layoutValue.get(props.id), display:"flex", ...alignmentCss.span}}>
            <img
                style={alignmentCss.img}
                ref={imageRef}
                src={ selectedRow ? "data:image/jpeg;base64," + selectedRow : context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
                alt={"could not be loaded"}
                onLoad={imageLoaded}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
        </span>

    )
}
export default UIEditorImage