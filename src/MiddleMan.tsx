import React, {FC} from 'react';
import App from './App';
import JVXProvider from "./JVX/jvxProvider";
import { HashRouter } from 'react-router-dom';

const MiddleMan: FC = () => {
    return (
        <HashRouter>
            <JVXProvider>
                <App />
            </JVXProvider>
        </HashRouter>
    )
}
export default MiddleMan