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