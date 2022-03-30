/** React imports */
import { ReactElement, useContext } from "react";
/** Other imports */
import { appContext } from "../../AppProvider";

type ScreenAPIType = {
    sendScreenParameter: (parameter: {[key:string]: any}) => void,
    sendCloseScreenRequest: (parameter?: {[key:string]: any}) => void,
    addCustomComponent: (name: string, customComp: ReactElement) => void,
    removeComponent: (name:string) => void
}

/**
 * Returns functions of the api class for screens without being forced to enter the screen-name everytime
 * @param screenName - the screen name
 */
const useScreen = (screenName: string): ScreenAPIType => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const sendScreenParameter = (parameter: { [key: string]: any }) => {
        context.api.sendScreenParameter(screenName, parameter);
    }

    const sendCloseScreenRequest = (parameter?: {[key:string]: any}) => {
        context.api.sendCloseScreenRequest(screenName, parameter);
    }

    const addCustomComponent = (name: string, customComp: ReactElement) => {
        context.api.addCustomComponent(name, customComp);
    }

    const removeComponent = (name: string) => {
        context.api.removeComponent(name);
    }

    return {
        sendScreenParameter: sendScreenParameter,
        sendCloseScreenRequest: sendCloseScreenRequest,
        addCustomComponent: addCustomComponent,
        removeComponent: removeComponent
    }
}
export default useScreen;