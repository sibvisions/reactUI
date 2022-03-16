import AppSettings from "../../AppSettings";

/**
 * Dynamically adds CSS-Stylesheets to the head at runtime
 * @param path - the path to the stylesheet
 * @param type - the type of stylesheet that is added
 * @param appSettings - the settings of the application
 */
export function addCSSDynamically(path:string, type:"appCSS"|"schemeCSS"|"themeCSS"|"designCSS", appSettings:AppSettings) {
    let before = undefined
    for (let link of document.head.getElementsByTagName('link')) {
        if (link.href.includes("application.css")) {
            before = link;
        }
    }

    for (let link of document.head.getElementsByTagName('link')) {
        if (link.href.includes("application.css") && type === "appCSS") {
            document.head.removeChild(link);
        }
        else if (link.href.includes("color-schemes") && type === "schemeCSS") {
            document.head.removeChild(link);
        }
        else if (link.href.includes("themes") && type === "themeCSS") {
            document.head.removeChild(link);
        }
        else if (link.href.includes("design") && type === "designCSS") {
            document.head.removeChild(link);
        }
    }
    const link:HTMLLinkElement = document.createElement('link');
    link.rel = 'stylesheet'; 
    link.type = 'text/css';
    link.href = path;
    link.addEventListener("load", () => appSettings.setAppReadyParam(type));

    if (before) {
        document.head.insertBefore(link, before);
    }
    else {
        document.head.appendChild(link);
    }
    
}