import { Component } from 'react';
import { register, handler } from "../../handling/TowerV2";

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
            this.setState({content: this.tempChanges});
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