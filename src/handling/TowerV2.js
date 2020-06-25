import React from 'react';

import {responseMaper} from './responeMaper';
import NPanel from '../components/responseObj/NPanel';
import NTable from '../components/responseObj/NTable';

//prime imports
import {Button} from 'primereact/button'


let superParent;
/**
 * Mounted Parent Components
 */
let MPC = []

/**
 * Registerd Menu change Functions
 */
let RMF = []


/**
 * full Content on display
 */
let superContent = [];

const BaseUrl= "http://localhost:8080/JVx.mobile/services/mobile"

//Handler

export function setSuperParent(context) {superParent = context}

export function sender(endpoint, body){
    let reqOpt = {
        method: 'POST',
        body: JSON.stringify(body),
        credentials:"include"
    };
    console.log("send")
    fetch(BaseUrl+endpoint,reqOpt)
        .then(res => res.json())
        .then(jRes => {console.log(jRes); jRes.forEach(e => handler(e))})
}

export function handler(request){
      responseMaper.forEach(e => {
        if(e.name === request.name) e.func(request)
    });
}

/**
 * Takes ComponentId of Button and
 * calls "/api/v2/pressButton"
 */
function buttonClicked(e){
  let body = {
      clientId: localStorage.getItem("clientId"),
      componentId: e
  }
  sender("/api/v2/pressButton", body);
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
  sender("/api/login",info)
}

/**
 * calls "/api/logout" with clientId stored in localStorage
 */
export function logOut(){
  console.log("logged out")
  cleanSlate();
  sendMenuChanges([])
  sender("/api/logout", {clientId: localStorage.getItem("clientId")});
  
}


//helper

/**
 * Adds clas reference to MPC
 * @param {any} it class reference
 */
export function register(it){
  MPC.push(it)
}

/**
 * Deletes all content and sets logIn mask
 */
function cleanSlate(){
  superParent.setState({content: [], menu: [], username:""})
}

/**
 * Appends a new Object to the superParents state.content
 * @param {ReactObject} newContent Element to add
 */
function addSuperParentContent(newContent){
  let content = [...superParent.state.content];
  content.push(newContent);
  superParent.setState({content: content});
}

/**
 * Trys to find the elements parent Obj in MPC and appends {toAdd} to its state.content
 * if non is found at to superParents state.content instead.
 * @param {ReactElement} toAdd 
 */
function addToParentContent(toAdd){
  if(toAdd.props.pid === undefined) addSuperParentContent(toAdd)
  else {
    let parent = MPC.find((e) => e.props.id === toAdd.props.pid);
    parent.addElement(toAdd);
  }
}

export function lazyLogin(){
  logIn("features", "features")
}

export function registerToMenuChanges(toBeCalled){
  RMF.push(toBeCalled);
}

export function unregisterFromMenuChanges(ToBeCalled){
  RMF.splice(RMF.indexOf(ToBeCalled), 1)
}

function sendMenuChanges(newMenuItems){
  RMF.forEach(e => {
    e(newMenuItems)
  });
}

//respone type handlers
export function login(){
  // let LogInMask = 
  //   <div key="LoginMask">
  //     <Button label="Log in Admin" key="admin" onClick={() => logIn("admin","admin")}/>
  //     <Button label="Log in Show" key="show" onClick={() => logIn("show","show")}/>
  //     <Button label="Log in feature" key="featues" onClick={() => logIn("features","features")}/>
  //   </div>
  // setSuperParentContent(LogInMask)
}

export function userData(input){
  superParent.setState({username: input.displayName})
}

export function applicationMetaData(metaData){
  localStorage.setItem("clientId", metaData.clientId);
}

export function menu(props){ 
  let groupsString= [];
  let groups = [];

  //Make out distinct groups
  props.items.forEach(parent => {
      if(groupsString.indexOf(parent.group) === -1) {
          groupsString.push(parent.group)
          groups.push({label: parent.group, items: [], key: parent.group})
      }
  });

  //Add SubMenus to parents
  groups.forEach(e => {
      props.items.forEach(subMenu => {
          if(e.label===subMenu.group) {
              e.items.push({label: subMenu.action.label,
                  componentId:subMenu.action.componentId,
                  command: () => buttonClicked(subMenu.action.componentId),
                  key:subMenu.action.label})
          }
      });
  });
  sendMenuChanges(groups);
  superParent.setState({menu: groups})
}

export function generic(props){
  let standard = []

  // if they are any changed components, change format to standard
  // and call setRelationship to build hierachy
  if(props.changedComponents !== undefined){
      props.changedComponents.forEach(e => {
          standard.push({id: e.id, pid: e.parent, name: e.className, elem: e, children: []})
      });
      buildHierachy(standard);
    }
    function buildHierachy(changedArray){
      let step = []
      changedArray.forEach(parent => {
        //foreach element look through each entry 
        //to see if they are their child
        changedArray.forEach(child => {
            if(parent.id === child.pid){
                //Check if it is already pushed
                if(parent.children.indexOf(child) === -1) parent.children.push(child) 
                if(step.indexOf(parent) === -1) step.push(parent) 
            }
        });
      });
      let again = false
      //check each object if they still have pid set, 
      //if yes call method again with newly build array
      step.forEach(parent => {
          if(parent.pid !== undefined) again = true 
      });
      //if hierachy has finished building set build hierachy
      if(again){ buildHierachy(step) } else { superContent.push(step); step.forEach(e => handler(e))}
  }
}

export function panel(input){
  addToParentContent(<NPanel 
    id={input.id} 
    pid={input.pid} 
    key={input.id}
    componentid={input.elem.name} 
    content={input.children}/>)
}

export function button(input){
  addToParentContent(<Button 
    key={input.id} 
    id={input.id} 
    pid={input.pid} 
    label={input.elem.text} 
    componentid={input.name} 
    onClick={() => buttonClicked(input.elem.name)}/>);



}

export function closeScreen(toClose){
  //check if top level element, if yes delete it and update superParent.state.content
  let toDelete = superParent.state.content.find((a) => a.props.componentid === toClose.componentId);
  if(toDelete !== undefined){
    let content = [...superParent.state.content];
    content.splice(content.indexOf(toDelete),1);
    superParent.setState({content: content});
  }
}

export function table(table){
    addToParentContent(<NTable 
      key={table.id} 
      id={table.id} 
      pid={table.pid}
      columnLabels={table.elem.columnLabels}
      columnNames={table.elem.columnNames}
      dataBook={table.elem.dataBook}
      dataProvider={table.elem.dataProvider}
      componentid={table.name} 
      />)
}


