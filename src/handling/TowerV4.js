import React, { forwardRef } from 'react';
import NPanel from "../components/responseObj/NPanelV2";
import { Button } from 'primereact/button';
import { Redirect } from 'react-router-dom';

const BaseUrl= "http://localhost:8080/JVx.mobile/services/mobile"
const functionMapper = [{
    name: "applicationMetaData",
    func: applicationMetaData
},
{
    name: "menu",
    func: menuBuilder
},
{
    name: "screen.generic",
    func: generic
},
{
    name:"userData",
    func: userData
},
{
    name:"Panel",
    func: panel
},
{
    name:"Button",
    func: button
},
{
    name:"closeScreen",
    func: closeWindow
}]

let user = {};

let Screen;
let Containers = [];
let RegMenuFunc = [];

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
        .then(jRes =>  {console.log(jRes); handler(jRes);});
}

/**
 * Iterares through the answerArray and calls the mapped function mapped
 * by the functionMapper
 * @param {Array} answerArray an Array of ResponseObjects
 */
export function handler(answerArray){
    answerArray.forEach(answer => {
        let temp = functionMapper.find(func => func.name === answer.name);
        if(temp !== undefined) temp.func(answer);
        
    });
}

/**
 * calls sender("/api/login") with login info as object
 * @param {string} username 
 * @param {string} password 
 */
export function logIn(username,password){
    let info = {
        clientId: localStorage.getItem("clientId"),
        loginData: {
          userName: {
            componentId: "UserName",
            text: username
          },
          password: {
            componentId: "Password",
            text: password
          },
          action : {
            componentId: "OK",
            label: "Anmelden"
          }
        }
      }
    console.log("logging in")
    sendRequest("/api/login",info)
}

/**
 * Calls {logIn} with user: "features", pass: "features"
 */
export function lazyLogin(){
    logIn("features", "features")
}

// Registration

/**
 * Adds classRefence to {Containers} array
 * @param {class} classReference Reference to Container Object
 */
export function registerContainer(classReference){
    Containers.push(classReference)
}

/**
 * Adds funtion reference to {RegMenuFunc} array
 * @param {function} toDo function to be called when the Menu Changes
 */
export function registerMenuChange(toDo){
    RegMenuFunc.push(toDo);
}

/**
 * Sets {Screen}
 * @param {class} classReference class Refernce to Screen
 */
export function registerScreen(classReference){
    Screen = classReference
}

/**
 * Removes reference from {Containers}
 * @param {class} classRefernece class Refernce to Container Obj
 */
export function unRegisterContainer(classRefernece) {
    Containers.splice(Containers.indexOf(classRefernece),1);
}

// Export Helper

/**
 * Returns currently logged in User
 */
export function getCurrentUser() {
    return user
}

/**
 * Calls {sendRequest} at "/api/logout" with clientId
 * Calls {Screen.removeAll} to close(delete) open windows
 * Calls {pushMenuUpdate} with an empty array to delete all menu entries
 */
export function logOut(){
    if(Screen !== undefined){
        Screen.removeAll();
    }
    pushMenuUpdate([]);
    let info = {
        "clientId": localStorage.getItem("clientId")
    }
    sendRequest("/api/logout", info)
}

// Helper

/**
 * Takes componentId of button and
 * calls {sendRequest} at "/api/v2/pressButton"
 */
function buttonClicked(e){
    let body = {
        clientId: localStorage.getItem("clientId"),
        componentId: e
    }
  
    sendRequest("/api/v2/pressButton", body);
}

/**
 * Calls {sendRequest} at "/api/startup"
 */
function startUp(){
    let info = {
        "layoutMode" : "generic",
        "appMode" : "full",
        "applicationName" : "demo"
      }; sendRequest("/api/startup", info);
}

// "Event" pusher

/**
 * Calls every registered Function-listen function 
 * @param {any} rawMenu MenuItems in raw-Array form
 */
function pushMenuUpdate(rawMenu){
    RegMenuFunc.forEach(e => {
        e(rawMenu);
    });
}

/**
 * calls Screen.addWindow, adds new Route in content and redirects to it
 * @param {react.element} newWindow a container element with no pId
 */
function openNewWindow(newWindow){
    Screen.addWindow(newWindow)
}

/**
 * Adds react element to its parent container, 
 * looks through all registerd Containers 
 * @param {react.element} toAdd React Element to add
 */
function addToParrentContainerById(toAdd){
    Containers.find(a => a.props.id === toAdd.props.pid).addContent(toAdd);
}

// Respone types

/**
 * Builds Menu and calls {pushMenuUpdate} when finished
 * @param {any} allMenuItems "menu" respone Object
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
                    command: () => buttonClicked(subMenu.action.componentId),
                    key:subMenu.action.label})
            }
        });
    });

    //Push new menu to all listeners
    pushMenuUpdate(groups);
}

/**
 * Sets the currently logged in User
 * @param {any} userInfo UserData respone Object
 */
function userData(userInfo){
    user = userInfo
}

/**
 * Saves the clientId to local storage with key "clientId"
 * @param {any} metaData "metaData" respone Object
 */
function applicationMetaData(metaData){
    localStorage.setItem("clientId", metaData.clientId);
}


/**
 * Either builds new Window if new Object is transmitted or
 * updates current 
 * @param {any} gen "generic.screen" response Object
 */
function generic(gen){
    let standard = []

    //check if they are any changed Componenents
    if(gen.changedComponents !== undefined && gen.changedComponents.length > 0){
        //change their format to standard
        gen.changedComponents.forEach(e => {
            standard.push({id: e.id, pid: e.parent, name: e.className, elem: e, children: []})
        });
        containerCreateOrUpdate(gen.name, standard);
    }

    if(!gen.update){
       Screen.routeToScreen(gen.componentId); 
    }

    /**
     * If a component with windowName is present calls {handler} with
     * updated components, if none is present builds hierachy and
     * then calls {handler} with newly build hierachy
     * @param {string} windowName componentName
     * @param {any[]} updatedElements changed components in standard format
     */
    function containerCreateOrUpdate(windowName, updatedElements) {
        let toUpdate = Containers.find(e => e.props.componentid === windowName)
        if(toUpdate === undefined){
            let newContainer = buildHierachy(updatedElements);
            handler([newContainer]);
            return true;
        } 
        handler(updatedElements)
    
        /**
         * Establishes parent - child relationships
         * returns highest object
         * @param {any[]} children all elemtents in standard form
         */
        function buildHierachy(children){
            let uberParent = children.find(a => a.pid === undefined);
            children.forEach(child => {
                if(child.pid === uberParent.id){
                    uberParent.children.push(child);
                }
                children.forEach(GC => {
                    if(GC.pid !== undefined && GC.id === child.pid){
                        GC.children.push(child);
                    }
                })
            })
            return uberParent;
        }
    }
}

/**
 * Checks if panel has a pid if so, calls {addToParrentContainerById}
 * if none is found calls {openNewWindow} with an initalized Panel
 * @param {any} panelData standard format panel
 */
function panel(panelData){

    let toAdd = <NPanel 
        id={panelData.id} 
        pid={panelData.pid} 
        children={panelData.children} 
        key={panelData.id}
        componentid={panelData.elem.name} />

    if(panelData.pid === undefined){
        openNewWindow(toAdd);
    }else{
        addToParrentContainerById(toAdd);
    }
}

/**
 * Calls {addToParrentContainerById} with initalised Button
 * @param {any} buttonData standard format button
 */
function button(buttonData){
    let toAdd = <Button 
        key={buttonData.id}
        id={buttonData.id} 
        pid={buttonData.pid} 
        label={buttonData.elem.text}
        onClick={() => buttonClicked(buttonData.elem.name)}
        componentid={buttonData.name} />

    addToParrentContainerById(toAdd);
}


/**
 * Calls {Screen.removeWindow} with componentId to close(delete) window
 * @param {any} windowData "close.screen" respone Object
 */
function closeWindow(windowData){
    Screen.removeWindow(windowData.componentId)
}












