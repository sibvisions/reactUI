import { firstCharToLower, firstCharToUpper } from "../util";

/** the supported operator types. */
export enum OperatorType
{
    /** and operator. */
    And = "And",
    /** or operator. */
    Or = "Or"
};

/** the supported compare types */
export enum CompareType {
    /** equals. */
    Equals = "Equals",
    /** like. */
    Like = "Like",
    /** like ignore case. */
    LikeIgnoreCase = "LikeIgnoreCase",
    /** like reverse. */
    LikeReverse = "LikeReverse",
    /** like reverse ignore case. */
    LikeReverseIgnoreCase = "LikeReverseIgnoreCase",
    /** less. */
    Less = "Less",
    /** less equals. */
    LessEquals = "LessEquals",
    /** greater. */
    Greater = "Greater",
    /** greater equals. */
    GreaterEquals = "GreaterEquals",
    /** contains ignore case. */
    ContainsIgnoreCase = "ContainsIgnoreCase",
    /** starts with ignore case. */
    StartsWithIgnoreCase = "StartsWithIgnoreCase",
    /** ends with ignore case. */
    EndsWithIgnoreCase = "EndsWithIgnoreCase"
}

class FilterCondition {
    columnName: string;
    value: any;
    compareType: string|null = null;
    operatorType: string|null = null;
    not: boolean = false;
    condition?: FilterCondition;
    conditions?: FilterCondition[];

    constructor(columnName:string, value:any) {
        this.columnName = columnName;
        this.value = value;
    }

    setColumnName(columnName:string) {
        this.columnName = columnName;
    }

    getColumnName() {
        return this.columnName;
    }

    setValue(value:any) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    setCompareType(compareType:CompareType) {
        this.compareType = compareType === null ? null : firstCharToLower(compareType.toString());
    }

    getCompareType() {
        if (this.compareType === null)
            return null
        else
            return CompareType[firstCharToUpper(this.compareType) as keyof typeof CompareType];
    }

    setOperatorType(operatorType:OperatorType) {
        this.operatorType = operatorType === null ? null : firstCharToLower(operatorType.toString());
    }

    getOperatorType() {
        if (this.operatorType === null)
            return null
        else
            return OperatorType[firstCharToUpper(this.operatorType) as keyof typeof OperatorType];
    }

    setNot(not:boolean) {
        this.not = not;
    }

    getNot() {
        return this.not;
    }

    setCondition(condition:FilterCondition) {
        this.condition = condition;
    }

    getCondition() {
        return this.condition;
    }

    setConditions(conditions:FilterCondition[]) {
        this.conditions = conditions
    }

    getConditions() {
        return this.conditions;
    }

}
export default FilterCondition