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

import { useContext, useEffect, useState } from "react"
import { appContext } from "../../contexts/AppProvider";

/**
 * This hook subscribes components to various designer changes which need to trigger a new size calculation.
 * @param type - the type is responsible for which variables the component is subscribed to
 */
const useDesignerUpdates = (type:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State which gets updated when designer stuff gets updated */
    const [designerUpdate, setDesignerUpdate] = useState<boolean|undefined>(undefined);

    useEffect(() => {
        const updateFunc = () => setDesignerUpdate(prevState => prevState === undefined ? prevState = true : !prevState);

        switch (type) {
            case "std-menu":
                context.designerSubscriptions.subscribeToStdHeader(updateFunc);
                context.designerSubscriptions.subscribeToStdMenuWidth(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "corp-menu":
                context.designerSubscriptions.subscribeToCorpHeader(updateFunc);
                context.designerSubscriptions.subscribeToCorpMenubar(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "default-button":
                context.designerSubscriptions.subscribeToButtonPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "icon-only-button":
                context.designerSubscriptions.subscribeToIconOnlyPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "menubutton":
                context.designerSubscriptions.subscribeToMenuButtonPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "linked-date":
                context.designerSubscriptions.subscribeToButtonBackground(updateFunc);
                context.designerSubscriptions.subscribeToInputButtonPadding(updateFunc);
                context.designerSubscriptions.subscribeToInputLRPadding(updateFunc);
                context.designerSubscriptions.subscribeToInputTBPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "checkbox":
                context.designerSubscriptions.subscribeToCheckboxSize(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "radiobutton":
                context.designerSubscriptions.subscribeToRadiobuttonSize(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "inputfield":
                context.designerSubscriptions.subscribeToInputLRPadding(updateFunc);
                context.designerSubscriptions.subscribeToInputTBPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "tabset":
                context.designerSubscriptions.subscribeToTabPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "table":
                context.designerSubscriptions.subscribeToTableHeaderPadding(updateFunc);
                context.designerSubscriptions.subscribeToTableDataHeight(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "menubar":
                context.designerSubscriptions.subscribeToMenuBarHeight(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
            case "label":
                context.designerSubscriptions.subscribeToInputLRPadding(updateFunc);
                context.designerSubscriptions.subscribeToInputTBPadding(updateFunc);
                context.designerSubscriptions.subscribeToFontSize(updateFunc);
                break;
        }

        return () => {
            switch (type) {
                case "std-menu":
                    context.designerSubscriptions.unsubscribeFromStdHeader(updateFunc);
                    context.designerSubscriptions.unsubscribeFromStdMenuWidth(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "corp-menu":
                    context.designerSubscriptions.unsubscribeFromCorpHeader(updateFunc);
                    context.designerSubscriptions.unsubscribeFromCorpMenubar(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "default-button":
                    context.designerSubscriptions.unsubscribeFromButtonPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "icon-only-button":
                    context.designerSubscriptions.unsubscribeFromIconOnlyPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "menubutton":
                    context.designerSubscriptions.unsubscribeFromMenuButtonPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "linked-date":
                    context.designerSubscriptions.unsubscribeFromButtonBackground(updateFunc);
                    context.designerSubscriptions.unsubscribeFromInputButtonPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromInputLRPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromInputTBPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "checkbox":
                    context.designerSubscriptions.unsubscribeFromCheckboxSize(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "radiobutton":
                    context.designerSubscriptions.unsubscribeFromRadiobuttonSize(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "inputfield":
                    context.designerSubscriptions.unsubscribeFromInputLRPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromInputTBPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "tabset":
                    context.designerSubscriptions.unsubscribeFromTabPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "table":
                    context.designerSubscriptions.unsubscribeFromTableHeaderPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromTableDataHeight(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "menubar":
                    context.designerSubscriptions.unsubscribeFromMenuBarHeight(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
                case "label":
                    context.designerSubscriptions.unsubscribeFromInputLRPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromInputTBPadding(updateFunc);
                    context.designerSubscriptions.unsubscribeFromFontSize(updateFunc);
                    break;
            }
        }

    }, [context.designerSubscriptions, type])

    return designerUpdate
}
export default useDesignerUpdates