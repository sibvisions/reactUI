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

const useDesignerImages = (type:string) => {
    const context = useContext(appContext);

    const [imagesChanged, setImagesChanged] = useState<boolean>(false);

    const [, setReloadImages] = useState<boolean>(false);

    useEffect(() => {
        if (context.appSettings.LOGO_BIG.includes('?v=')) {
            context.appSettings.LOGO_BIG = context.appSettings.LOGO_BIG.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_BIG = context.appSettings.LOGO_BIG + '?v=' + Date.now();
        }

        if (context.appSettings.LOGO_SMALL.includes('?v=')) {
            context.appSettings.LOGO_SMALL = context.appSettings.LOGO_SMALL.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_SMALL = context.appSettings.LOGO_SMALL + '?v=' + Date.now();
        }

        if (context.appSettings.LOGO_LOGIN.includes('?v=')) {
            context.appSettings.LOGO_LOGIN = context.appSettings.LOGO_LOGIN.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_LOGIN = context.appSettings.LOGO_LOGIN + '?v=' + Date.now();
        }

        setReloadImages(prevState => !prevState);
    }, [imagesChanged])

    return setImagesChanged
}
export default useDesignerImages