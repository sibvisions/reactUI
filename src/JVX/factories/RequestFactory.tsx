import StartupRequest from "../request/StartupRequest";
import LoginRequest from "../request/LoginRequest";
import PressButtonRequest from "../request/PressButtonRequest";
import OpenScreenRequest from "../request/OpenScreenRequest";



const getClientId = (): string => {
    return sessionStorage.getItem("clientId") || "ClientIdNotFound"
}

export const createStartupRequest = (values?: StartupRequest): StartupRequest => {
    const req: StartupRequest = {
        layoutMode: values?.layoutMode || "generic",
        appMode: values?.appMode || "full",
        applicationName: values?.applicationName || "demo",

        authKey: values?.authKey,
        userName: values?.userName,
        password: values?.password,

        osName: values?.osName,
        osVersion: values?.osVersion,
        technology: values?.technology || "react",

        screenWidth: values?.screenWidth || 1920,
        screenHeight: values?.screenHeight || 1080,

        deviceType: values?.deviceType || 'Browser',
        deviceTypeModel: values?.deviceTypeModel || navigator.userAgent,

        readAheadLimit: values?.readAheadLimit || 100
    }
    return  req;
}

export const createLoginRequest = (values?: LoginRequest): LoginRequest => {
    const req: LoginRequest = {
        clientId: values?.clientId || getClientId(),
        createAuthKey: values?.createAuthKey || true,
        loginData: {
            userName: {
                componentId: values?.loginData.userName.componentId || "UserName",
                text: values?.loginData.userName.text
            },
            password: {
                componentId: values?.loginData.password.componentId || "Password",
                text: values?.loginData.password.text
            },
            action: {
                componentId: values?.loginData.action.componentId || "OK",
                label: values?.loginData.action.label || "Anmelden"
            }
        }
    }
    return req;
}

export const createPressButtonRequest = (values?: PressButtonRequest): PressButtonRequest => {
    const req: PressButtonRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

export const createOpenScreenRequest = (values?: OpenScreenRequest): OpenScreenRequest => {
    const req: OpenScreenRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

