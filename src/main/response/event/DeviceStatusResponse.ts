import { BaseResponse } from "..";

export type DeviceStatus = "Full"|"Small"|"Mini";

/** Interface for device-status response */
interface DeviceStatusResponse extends BaseResponse {
    layoutMode: DeviceStatus;
}
export default DeviceStatusResponse;