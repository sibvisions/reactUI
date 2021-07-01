import { BaseRequest } from ".";

/** Interface for DeviceStatusRequest */
interface DeviceStatusRequest extends BaseRequest {
    screenWidth: number,
    screenHeight: number
}
export default DeviceStatusRequest