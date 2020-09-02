import { useContext, useState, useEffect } from 'react';
import { RefContext } from '../helper/Context';

function useCompStartUp(props) {
    const [content, setContent] = useState(null);
    const con = useContext(RefContext)

    function startUp() {
        let content = [];
        if (props.subjects) {
            props.subjects.forEach(subject => {
                let temp = con.uiBuilder.compontentHandler(subject);
                if (temp) content.push(temp); 
            });
            setContent(content)
        }
    }

    useEffect(() => {
        startUp();
    });

    return content;
}