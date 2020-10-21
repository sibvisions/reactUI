import BaseResponse from "./BaseResponse";

interface DownloadResponse extends BaseResponse{
    fileId: string;
    fileName: string;
    url: string
}
export default DownloadResponse