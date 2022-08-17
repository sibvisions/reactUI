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

import React, { FC, useState, createContext } from "react";
import TopBarProgress from "react-topbar-progress-indicator";
import getSettingsFromCSSVar from "../../util/html-util/GetSettingsFromCSSVar";

// Interface for the topbar-context
export interface TopBarContextType {
    show: Function
    hide: Function
}


export const TopBarContext = createContext<TopBarContextType>({
    show: () => {},
    hide: () => {}
});

/**
 * Shows the topbar and after the promise is fulfilled, the topbar disappears
 * @param promise - the promise which is being sent
 * @param topbar - the topbar to display
 * @returns 
 */
export function showTopBar(promise: Promise<any>, topbar: TopBarContextType) {
    topbar.show();
    return promise.finally(() => topbar.hide());
};

// Shows a topbar at the top of the browser when a promise is being processed.
const TopBar:FC = ({children}) => {
    const [show, setShow] = useState(false);

    const { barColors, shadowBlur, barThickness, shadowColor } = getSettingsFromCSSVar({
        barColors: {
            cssVar: '--topbar-colors',
            transform: 'csv'
        },
        shadowBlur: {
            cssVar: '--topbar-shadow-blur',
            transform: 'float'
        },
        barThickness: {
            cssVar: '--topbar-thickness',
            transform: 'float'
        },
        shadowColor: '--topbar-shadow-color'
    })

    TopBarProgress.config({
        barColors: Object.fromEntries((barColors as string[]).map((v, idx, a) => [idx / (a.length - 1), v])),
        shadowBlur,
        barThickness,
        shadowColor
    });

    return <TopBarContext.Provider value={{
        show: () => setShow(true),
        hide: () => setShow(false)
    }} >
        {children}
        {show ? <TopBarProgress /> : null }
    </TopBarContext.Provider>
}

export default TopBar;