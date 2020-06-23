import { Component } from 'react';
import { register, handler } from "../handling/TowerV2";

class Base extends Component {

    tempChanges = [];
    /**
     * registers Component and builds child components
     */
    componentDidMount(){
        register(this);
        if(this.props.content !== undefined){  
            this.props.content.forEach(e => {
                handler(e);
            });
            let oldState = [...this.state.content]
            this.tempChanges.forEach(e => {
                oldState.push(e)
            });
            this.setState({content: oldState})
            console.log("-----------------------------------------------------------------")
            console.log("props"); console.log(this.props);
            console.log("this"); console.log(this);
            console.log("tempChanges"); console.log(this.tempChanges);
            console.log("-----------------------------------------------------------------")
            this.tempChanges = [];
        }   
    }

    /**
     * Appends React Element to content, does not trigger re-render
     * @param {any} toAdd element to add
     */
    addElement(toAdd){
        this.tempChanges.push(toAdd);
    }
}
 
export default Base;