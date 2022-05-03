import React, { FC, useContext } from "react";
import { appContext } from "../../../AppProvider";
import { ICellEditorImage } from "../../editors";
import { ICellRender } from "../";

const ImageCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorImage;

    return (
        <>
            <div className="cell-data-content">
               {props.icon ?? <img className="rc-table-image" src={props.cellData ? "data:image/jpeg;base64," + props.cellData : context.server.RESOURCE_URL + castedCellEditor.defaultImageName} alt="could not be loaded"/>}
            </div>
        </>
    )
}
export default ImageCellRenderer
