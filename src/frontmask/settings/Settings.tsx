import React, {FC, useContext} from "react";
import {jvxContext} from "../../JVX/jvxProvider";
import {Card} from 'primereact/card';
import {RadioButton} from 'primereact/radiobutton';

const Settings: FC = () => {
    const context = useContext(jvxContext)

    return (
        <div>
            <Card className="p-col-3" style={{ marginRight: '10px' }} title="Theme" subTitle="Hier kann eingestellt werden, welches Theme angezeigt werden soll.">
                <RadioButton checked={context.theme === 'dark'} inputId="rb1" name="theme" value="dark" onChange={() => context.setTheme("dark")} />
                <label htmlFor="rb1" className="p-radiobutton-label">Dark</label>
                <RadioButton checked={context.theme === 'light'} inputId="rb2" name="theme" value="light" onChange={() => context.setTheme("light")} />
                <label htmlFor="rb2" className="p-radiobutton-label">Light</label>
                <RadioButton checked={context.theme === 'blue'} inputId="rb3" name="theme" value="blue" onChange={() => context.setTheme("blue")} />
                <label htmlFor="rb3" className="p-radiobutton-label">Blue</label>
            </Card>
        </div>
    )
}
export default Settings