/** Interface for StartupRequest */
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
    language?:string

    screenWidth?: number
    screenHeight?: number

    deviceMode: "desktop"|"mobile"

    deviceType: string
    deviceTypeModel: string

    readAheadLimit?: number
    [customProps: string]: any
}
export default StartupRequest;