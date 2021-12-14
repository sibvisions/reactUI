export function addCSSDynamically(path:string, type:"app"|"scheme"|"theme") {
    for (let link of document.head.getElementsByTagName('link')) {
        if (link.href.includes("application.css") && type === "app") {
            document.head.removeChild(link);
        }
        else if (link.href.includes("color-schemes") && type === "scheme") {
            document.head.removeChild(link);
        }
        else if (link.href.includes("themes") && type === "theme") {
            document.head.removeChild(link);
        }
    }
    const link:HTMLLinkElement = document.createElement('link');
    link.rel = 'stylesheet'; 
    link.type = 'text/css';
    link.href = path;
    document.head.appendChild(link);
}