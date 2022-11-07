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

const useDesignerUpdates = (type:string) => {
    const context = useContext(appContext);

    const [designerUpdate, setDesignerUpdate] = useState<boolean>(false);

    useEffect(() => {
        switch (type) {
            case "default-button":
                context.designerSubscriptions.subscribeToButtonPadding(() => setDesignerUpdate(prevState => !prevState));
                break;
            case "checkbox":
                context.designerSubscriptions.subscribeToCheckboxSize(() => setDesignerUpdate(prevState => !prevState));
                break;
            case "radiobutton":
                context.designerSubscriptions.subscribeToRadiobuttonSize(() => setDesignerUpdate(prevState => !prevState));
                break;
        }

        return () => {
            switch (type) {
                case "default-button":
                    context.designerSubscriptions.unsubscribeFromButtonPadding(() => setDesignerUpdate(prevState => !prevState));
                    break;
                case "checkbox":
                    context.designerSubscriptions.unsubscribeFromCheckboxSize(() => setDesignerUpdate(prevState => !prevState));
                    break;
                case "radiobutton":
                    context.designerSubscriptions.unsubscribeFromRadiobuttonSize(() => setDesignerUpdate(prevState => !prevState));
                    break;
            }
        }

    }, [context.designerSubscriptions, type])

    return designerUpdate
}
export default useDesignerUpdates