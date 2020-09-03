interface StartupRequest {
    layoutMode: string
    appMode: string
    applicationName: string

    userName?: string
    password?: string
    authKey?: string

    osName?: string
    osVersion?: string
    technology: string

    screenWidth?: number
    screenHeight?: number

    deviceType: string
    deviceTypeModel: string

    readAheadLimit: number
}
export default StartupRequest;