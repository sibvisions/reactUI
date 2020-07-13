import { Component } from 'react';
import { RefContext } from '../Context';

class Base extends Component {

    state = {  }
    
    componentDidMount() {
        let content = [];
        content.length = 0

        this.props.subjects.forEach(subjcet => {
            content.push(this.context.uiBuilder.compontentHandler(subjcet));
        });
        this.setState({content: content});
    }

}
Base.contextType = RefContext
export default Base;