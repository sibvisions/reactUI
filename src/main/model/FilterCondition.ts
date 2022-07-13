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

import { firstCharToLower } from "../util/string-util/FirstCharToLower";
import { firstCharToUpper } from "../util/string-util/FirstCharToUpper";

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
    /** The columnName of the filter condition */
    columnName: string;

    /** The filter value */
    value: any;

    /** The filter compare-type */
    compareType: string|null = null;

    /** The filter operator type */
    operatorType: string|null = null;

    /** True, if the operation contains a "not" */
    not: boolean = false;

    /** The filtercondition */
    condition?: FilterCondition;

    /** multiple filterconditions */
    conditions?: FilterCondition[];

    constructor(columnName:string, value:any) {
        this.columnName = columnName;
        this.value = value;
    }

    /** Sets the columnName */
    setColumnName(columnName:string) {
        this.columnName = columnName;
    }

    /** Returns the columnName */
    getColumnName() {
        return this.columnName;
    }

    /** Sets the value */
    setValue(value:any) {
        this.value = value;
    }

    /** Returns the value */
    getValue() {
        return this.value;
    }

    /** Sets the compareType */
    setCompareType(compareType:CompareType) {
        this.compareType = compareType === null ? null : firstCharToLower(compareType.toString());
    }

    /** Returns the compareType */
    getCompareType() {
        if (this.compareType === null)
            return null
        else
            return CompareType[firstCharToUpper(this.compareType) as keyof typeof CompareType];
    }

    /** Sets the operatorType */
    setOperatorType(operatorType:OperatorType) {
        this.operatorType = operatorType === null ? null : firstCharToLower(operatorType.toString());
    }

    /** Returns the operatorType */
    getOperatorType() {
        if (this.operatorType === null)
            return null
        else
            return OperatorType[firstCharToUpper(this.operatorType) as keyof typeof OperatorType];
    }

    /** Sets "not" */
    setNot(not:boolean) {
        this.not = not;
    }

    /** Returns "not" */
    getNot() {
        return this.not;
    }

    /** Sets the condition */
    setCondition(condition:FilterCondition) {
        this.condition = condition;
    }

    /** Returns the condition */
    getCondition() {
        return this.condition;
    }

    /** Sets the multiple conditions */
    setConditions(conditions:FilterCondition[]) {
        this.conditions = conditions
    }

    /** Returns the multiple conditions */
    getConditions() {
        return this.conditions;
    }

}
export default FilterCondition