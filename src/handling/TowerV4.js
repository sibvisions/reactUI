import { responseMaper } from "./responeMaper";

const BaseUrl= "http://localhost:8080/JVx.mobile/services/mobile"
const functionMapper = [{
    name: "applicationMetaData",
    func: applicationMetaData
},
{
    name: "menu",
    func: menuBuilder
}]

let user = {};
let topLvlContent = []

/**
 * Sends the request to the endpoint and calls handler with response
 * @param {string} endpoint endpoint to send the reqeust to
 * @param {Object} body ReqeustBody will be converted to JSON
 */
export function sendRequest(endpoint, body){
    let reqOpt = {
        method: 'POST',
        body: JSON.stringify(body),
        credentials:"include"
    };
    fetch(BaseUrl+endpoint, reqOpt)
        .then(res => res.json())
        .then(jRes => handler(jRes));
}

/**
 * Iterares through the answerArray and calls the mapped function mapped
 * by the functionMapper
 * @param {Array} answerArray an Array of anwser Objects
 */
export function handler(answerArray){
    answerArray.forEach(answer => {
        functionMapper.find(func => func.name === answer.name).func(answer);
    });
}

// Respone types

/**
 * Builds the hierachy of the menu and ...
 * @param {Array} allMenuItems an unsorted list of all menu elemnts
 */
function menuBuilder(allMenuItems){
    let groupsString= [];
    let groups = [];
  
    //Make out distinct groups
    allMenuItems.items.forEach(parent => {
        if(groupsString.indexOf(parent.group) === -1) {
            groupsString.push(parent.group)
            groups.push({label: parent.group, items: [], key: parent.group})
        }
    });
  
    //Add SubMenus to parents
    groups.forEach(e => {
        allMenuItems.items.forEach(subMenu => {
            if(e.label===subMenu.group) {
                e.items.push({label: subMenu.action.label,
                    componentId:subMenu.action.componentId,
                    
                    key:subMenu.action.label})
            }
        });
    });
}

/**
 * sets user
 * @param {Object} userInfo userInfo
 */
function userData(userInfo) {
    user = userInfo
}

/**
 * Returns currently logged in User
 */
export function getCurrentUser() {
    return user
}

/**
 * Saves the clientId to localStorage with key "clientId"
 * @param {Object} metaData 
 */
function applicationMetaData(metaData) {
    localStorage.setItem("clientId", metaData.clientId);
}

function generic(gen) {
    let standard = []

    if(gen.changedComponents !== undefined && gen.changedComponents.length > 0){
        gen.changedComponents.forEach(e => {
            standard.push({id: e.id, pid: e.parent, name: e.name, elem: e})
        });

    }
}










