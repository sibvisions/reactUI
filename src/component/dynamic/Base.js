import { Component } from 'react';
import { RefContext } from '../helper/Context';

class Base extends Component {

    state = {  }
    
    componentDidMount() {
        let content = [];
        content.length = 0

        if(this.props.subjects){
            this.props.subjects.forEach(subjcet => {
                let temp = this.context.uiBuilder.compontentHandler(subjcet);
                temp ? content.push(temp) : console.log();
            });
            this.setState({content: content});
        }
    }

}
Base.contextType = RefContext
export default Base;