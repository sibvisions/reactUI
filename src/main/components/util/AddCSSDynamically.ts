import AppSettings from "../../AppSettings";

export function addCSSDynamically(path:string, type:"appCSS"|"schemeCSS"|"themeCSS"|"designCSS", appSettings:AppSettings) {
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
    
    document.head.appendChild(link);
}