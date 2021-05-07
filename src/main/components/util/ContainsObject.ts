/** 3rd Party imports */
import * as _ from 'underscore'

/**
 * Checks if an object is in an array, used if there is no reference available and objects need to be compared per values.
 * Returns true or false if the object is in the array or not
 * @param obj - the object you want to find
 * @param list - the list which should be searched
 * @returns - true/false if the object is in the list
 */
export function containsObject(obj:any, list:any[]) {
    var res = _.find(list, function(val){ return _.isEqual(obj, val)});
    return (_.isObject(res))? true:false;
}