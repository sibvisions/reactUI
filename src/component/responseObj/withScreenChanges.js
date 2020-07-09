import React from 'react';
import { Component } from 'react';
import { registerScreen } from '../../handling/Tower';
import { Redirect } from 'react-router-dom';

export function withScreenChanges(WrappedComponent) {
    return class extends Component {
        constructor(props) {
            super(props);
            this.state = {
                menu: [],
                content: [],
                username: ""
            }
            registerScreen(this);
    
            this.addWindow = this.addWindow.bind(this);
            this.removeWindow = this.removeWindow.bind(this);
        }

        componentDidMount() {
            console.log(this.props)
        }
    
        /**
         * Calls {setState} to set {state.route} with a Redirect Component
         * which will redirect to the window once rendered. 
         * @param {string} navigateTo componentId to route to
         */
        routeToScreen(navigateTo){
            this.setState({route: <Redirect to={"/"+navigateTo}/>})
        }
    
        /**
         * Calls {setState} to set {state.username} to display the Username
         * in the Content Component
         * @param {string} user 
         */
        addUser(user) {
            this.setState({username: user})
        }
    
        /**
         * Adds (toAdd) to {state.content} and calls {setState}
         * with updated content  
         * @param {BaseV2} toAdd initalised container element
         */
        addWindow(toAdd){
            let con = [...this.state.content];
            con.push(toAdd)
            this.setState({content: con});
        }
    
        /**
         * Removes top level element in {state.content} by its componentId
         * calls {setState} with updated content
         * @param {string} id componentId of top element
         */
        removeWindow(id){
            let con = [...this.state.content];
            let toDelete = con.find(e => e.props.componentid === id);
            let indexToDelete = con.indexOf(toDelete);
            con.splice(indexToDelete,1);
            this.setState({content: con});
        }
    
        /**
         * Calls {setState} and sets the content to an empty array
         * deleting all open windows
         */
        removeAll(){
            this.setState({content: []});
        }

        render() {
            return <WrappedComponent {...this.props} {...this.state}/>;
        }
    }
}
