/** React imports */
import React, { FC } from 'react';

/** scss */
import './index.scss';

/** 3rd Party imports */
import { HashRouter } from 'react-router-dom';

/** Other imports */
import App from './App';
import AppProvider from "./main/AppProvider";
import { IUIManagerProps } from './frontmask/UIManager';

export interface ICustomContent {
    customAppWrapper?: IUIManagerProps["customAppWrapper"]
    onStartup?: Function
    onMenu?: Function
    onOpenScreen?: Function
}

/**
 * This component is used as a middleman between index.tsx and App.tsx before index.tsx looked like this, but because this needed to
 * be exported for the context to work and index couldn't be exported, this component was created.
 * When using reactUI as a library this is the component they will use and pass props which will be passed to App.tsx
 * @param props - Custom Content which will be passed to App.
 */
const MiddleMan: FC<ICustomContent> = (props) => {

    return (
        <HashRouter>
            <AppProvider>
                <App {...props}/>
            </AppProvider>
        </HashRouter>
    )
}
export default MiddleMan;