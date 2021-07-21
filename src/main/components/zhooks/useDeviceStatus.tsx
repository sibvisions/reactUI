/** React imports */
import { useContext, useEffect, useRef, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { DeviceStatus } from "../../response/DeviceStatusResponse";

const useDeviceStatus = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the loaded translation */
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(context.appSettings.deviceStatus);
    /** Last value of deviceStatus to prevent unnecassary state updates */
    const lastDeviceStatus = useRef<DeviceStatus>(context.appSettings.deviceStatus);

    /** Subscribes to device-status to update the state of the components */
    useEffect(() => {
        context.subscriptions.subscribeToDeviceMode((deviceStatus: DeviceStatus) => {
            if (deviceStatus !== lastDeviceStatus.current) {
                lastDeviceStatus.current = deviceStatus;
                setDeviceStatus(deviceStatus);
            }
        })

        return () => context.subscriptions.unsubscribeFromDeviceMode((deviceStatus: DeviceStatus) => {
            if (deviceStatus !== lastDeviceStatus.current) {
                lastDeviceStatus.current = deviceStatus;
                setDeviceStatus(deviceStatus);
            }
        })
    }, [context.subscriptions])

    return deviceStatus
}
export default useDeviceStatus