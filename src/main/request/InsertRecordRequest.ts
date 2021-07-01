import { BaseRequest } from ".";

/** Interface for InsertRecordRequest */
interface InsertRecordRequest extends BaseRequest {
    dataProvider?:string
}
export default InsertRecordRequest;