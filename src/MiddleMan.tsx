import React, {FC} from 'react';
import './index.scss';
import App from './App';
import JVXProvider from "./JVX/jvxProvider";
import { HashRouter } from 'react-router-dom';
import CustomScreenType from './JVX/customTypes/CustomScreenType';
import ReplaceScreenType from './JVX/customTypes/ReplaceScreenType';
import CustomComponentType from './JVX/customTypes/CustomComponentType';
import customStartupProps from './JVX/customTypes/CustomStartupProps';

export interface ICustomContent {
    customScreens?: Array<CustomScreenType>
    replaceScreens?: Array<ReplaceScreenType>
    customComponents?: Array<CustomComponentType>
    customStartupProps?: Array<customStartupProps>
}

const MiddleMan: FC<ICustomContent> = (props) => {

    return (
        <HashRouter>
            <JVXProvider>
                <App {...props}/>
            </JVXProvider>
        </HashRouter>
    )
}
export default MiddleMan;