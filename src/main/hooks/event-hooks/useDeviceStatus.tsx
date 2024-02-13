/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { appContext } from "../../contexts/AppProvider";
import { DeviceStatus } from "../../response/event/DeviceStatusResponse";

/**
 * Returns the current devicestatus of the application
 * @param sigpad - true, if the caller of this hook is a signaturepad
 */
const useDeviceStatus = (sigpad?:boolean) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the loaded translation */
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus|boolean>(sigpad ? false : context.appSettings.deviceStatus);
    
    /** Last value of deviceStatus to prevent unnecassary state updates */
    const lastDeviceStatus = useRef<DeviceStatus>(context.appSettings.deviceStatus);

    /** Subscribes to device-status to update the state of the components */
    useEffect(() => {
        context.subscriptions.subscribeToDeviceMode((deviceStatus: DeviceStatus) => {
            if (deviceStatus !== lastDeviceStatus.current) {
                lastDeviceStatus.current = deviceStatus;
                setDeviceStatus(deviceStatus);
            }
            else if (sigpad) {
                setDeviceStatus(prevState => sigpad ? !prevState : deviceStatus);
            }
        })

        return () => context.subscriptions.unsubscribeFromDeviceMode((deviceStatus: DeviceStatus) => {
            if (deviceStatus !== lastDeviceStatus.current) {
                lastDeviceStatus.current = deviceStatus;
                setDeviceStatus(deviceStatus);
            }
            else if (sigpad) {
                setDeviceStatus(prevState => sigpad ? !prevState : deviceStatus);
            }
        })
    }, [context.subscriptions])

    return deviceStatus
}
export default useDeviceStatus