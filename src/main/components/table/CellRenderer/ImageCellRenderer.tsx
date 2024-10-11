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
import { parseIconData } from "../../comp-props/ComponentProperties";

/**
 * Renders the image-cell when the column is an image-cell
 * @param props - the properties received from the table
 */
const ImageCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Casts the cell-editor property to ICellEditorImage because we can be sure it is a image-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorImage;

    /** The icon-data parsed */
    const iconData = props.cellData && props.cellData.includes("FontAwesome") ? parseIconData(undefined, props.cellData) : undefined;

    /** Either use base64 encoding, resource url or use the defaultImageName */
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

    /** Returns either the icon if cellFormatting, an icon element if FontAwesome icon or an image element */
    const getImageElement = () => {
        if (props.cellData) {
            if (iconData) {
                return (
                    <i
                        className={iconData.icon}
                        style={{
                            color: iconData.color,
                            fontSize: iconData.size?.height
                        }} />
                )
            }
            else {
                return (
                    <img
                        className="rc-table-image"
                        src={getImageSource()}
                        alt="could not be loaded" />
                )
            }
        }
        else {
            <></>
        }
    }

    return (
        <>
            <span className="cell-data-content">
                {props.icon != undefined && <span className="cell-data-profileimage">{props.icon}</span>}
                {props.icon && props.cellData && <span style={{marginRight: 5}}/>}
                <span className="cell-data-content-image">{getImageElement()}</span>
            </span>
        </>
    )
}
export default ImageCellRenderer
