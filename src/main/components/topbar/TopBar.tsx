import React, { FC, useState, createContext } from "react";
import TopBarProgress from "react-topbar-progress-indicator";
import getSettingsFromCSSVar from "../util/GetSettingsFromCSSVar";

export interface TopBarContextType {
    show: Function
    hide: Function
}

export const TopBarContext = createContext<TopBarContextType>({
    show: () => {},
    hide: () => {}
});

export function showTopBar(promise: Promise<any>, topbar: TopBarContextType) {
    topbar.show();
    return promise.finally(() => topbar.hide());
};

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