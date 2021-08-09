/** React imports */
import { ReactElement, useContext } from "react";
/** Other imports */
import { appContext } from "../../AppProvider";

type ScreenAPIType = {
    sendScreenParameter: (parameter: {[key:string]: any}) => void,
    sendCloseScreen: (parameter?: {[key:string]: any}, useClassName?:boolean) => void,
    addCustomComponent: (name: string, customComp: ReactElement) => void,
    removeComponent: (name:string) => void
}

const useScreen = (screenName: string): ScreenAPIType => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const sendScreenParameter = (parameter: { [key: string]: any }) => {
        context.api.sendScreenParameter(screenName, parameter);
    }

    const sendCloseScreen = (parameter?: {[key:string]: any}, useClassName?:boolean) => {
        context.api.sendCloseScreen(screenName, parameter, useClassName);
    }

    const addCustomComponent = (name: string, customComp: ReactElement) => {
        context.api.addCustomComponent(name, customComp);
    }

    const removeComponent = (name: string) => {
        context.api.removeComponent(name);
    }

    return {
        sendScreenParameter: sendScreenParameter,
        sendCloseScreen: sendCloseScreen,
        addCustomComponent: addCustomComponent,
        removeComponent: removeComponent
    }
}
export default useScreen;