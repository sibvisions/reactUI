/* Copyright 2023 SIB Visions GmbH
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

import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { appContext } from "../../main/contexts/AppProvider";
import { Dialog } from "primereact/dialog";
import { translation } from "../../main/util/other-util/Translation";
import { Button } from "primereact/button";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import { useVisibleWithHistoryBlock } from "../../main/hooks/components-hooks/useHistoryBlockClose";

/** 
 * When an upload response takes too long, the file dialog can not be opened because a user gesture is needed.
 * Instead this dialog will be shown which contains a button to open the file dialog. 
 */
const UploadDialog:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True, if the UploadDialog is visible */
    const [visible, setVisible] = useVisibleWithHistoryBlock(false, () => {
        setFileId("");
    });

    /** The fileId to send in the upload request */
    const [fileId, setFileId] = useState<string>("");

    /** Reference for the file input element */
    const inputRef = useRef<HTMLInputElement>(null);

    /** Subscribes to upload dialog visibility and fileId */
    useEffect(() => {
        context.subscriptions.subscribeToUploadDialog((fileId: string) => {
            setFileId(fileId);
            setVisible(true);
        })
    }, [context.subscriptions]);

    return (
        <Dialog
            className="upload-popup"
            header={translation.get("Upload")}
            baseZIndex={1010}
            visible={visible}
            onHide={() => { setVisible(false); setFileId("") }}>
            <Button
                label={translation.get("Upload")}
                icon="pi pi-upload"
                onClick={() => {
                    // Open the file dialog when the button is clicked
                    if (inputRef.current) {
                        inputRef.current.click();
                    }
                }} />
            <input
                type="file"
                ref={inputRef}
                style={{ visibility: "hidden", height: "0px", width: "0px" }}
                onChange={(e) => {
                    if (inputRef.current) {
                        if (fileId) {
                            const formData = new FormData();
                            formData.set("clientId", sessionStorage.getItem("clientId") || "")
                            // @ts-ignore
                            formData.set("data", e.target.files[0])
                            formData.set("fileId", fileId)
                            context.server.sendRequest({ upload: true, formData: formData }, REQUEST_KEYWORDS.UPLOAD);
                        }
                        else {
                            console.error('No fileId set!');
                        }
                    }
                    setVisible(false);
                }} />
        </Dialog>
    )
}
export default UploadDialog