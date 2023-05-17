/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useContext } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { ICellEditorImage } from "../../editors/image/UIEditorImage";
import { ICellRender } from "../CellEditor";

/**
 * Renders the image-cell when the column is an image-cell
 * @param props - the properties received from the table
 */
const ImageCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Casts the cell-editor property to ICellEditorImage because we can be sure it is a image-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorImage;

    const getImageSource = () => {
        if (props.cellData) {
            if (props.columnMetaData) {
                if (props.columnMetaData.dataTypeIdentifier === -2) {
                    return "data:image/jpeg;base64," + props.cellData;
                }
                else {
                    return context.server.RESOURCE_URL + props.cellData;
                }
            } 
        }
        return context.server.RESOURCE_URL + castedCellEditor.defaultImageName;
    }

    return (
        <>
            <span className="cell-data-content">
               {
                    props.icon ?? 
                    <img 
                        className="rc-table-image" 
                        src={getImageSource()} 
                        alt="could not be loaded" />
                }
            </span>
        </>
    )
}
export default ImageCellRenderer
