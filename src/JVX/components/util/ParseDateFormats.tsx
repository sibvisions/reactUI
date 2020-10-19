export function parseDateFormatCell(dateFormat:string|undefined) {
    let formatted = dateFormat;
    if (dateFormat?.includes("MMMM")) {
        formatted = formatted?.replace("MMMM", 'MM').replace(", HH:mm", '').replace(" HH:mm", '');
    }
    else if (dateFormat?.includes("MM")) {
        formatted = formatted?.replace("MM", "mm").replace(", HH:mm", '').replace(" HH:mm", '');
    }
    if (dateFormat?.includes("yyyy")) {
        formatted = formatted?.replace("yyyy", "yy");
    }
    else if (dateFormat?.includes("y") && !dateFormat?.includes("yy")) {
        formatted = formatted?.replace("y", "yy");
    }
    return formatted
}

export function parseDateFormatTable(dateFormat:string|undefined) {
    let formatted = dateFormat;
    if (dateFormat?.includes('d')) {
        formatted = formatted?.replaceAll('d', 'D');
    }
    if (dateFormat?.includes('y')) {
        formatted = formatted?.replaceAll('y', 'Y');
    }
    return formatted;
}