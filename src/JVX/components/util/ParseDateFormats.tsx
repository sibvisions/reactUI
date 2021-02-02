import moment from 'moment'

function getWeekIndexInMonth(day:any) {
    const startOfMonth = moment(day).startOf('month');
    const endOfMonth = moment(day).endOf('month');
  
    let currentMomentDate = moment(startOfMonth);
    const weeks = [];
    while (currentMomentDate.isBefore(endOfMonth)) {
      weeks.push(currentMomentDate.week());
      currentMomentDate.add(1, "weeks").startOf("week");
    }
    return weeks.indexOf(moment(day).week()+1).toString()
}

function mapDayName(dateFormat:string) {
    let i = 0
    let count = 0;
    while (dateFormat[i] === 'E') {
        count++;
        i++;
    }
    return count;
}

function mapPart(dateFormat:string, test:any) {
    const mapList:any = {G: 'N', y: 'Y', Y: 'g', M: 'M', w: 'w', W: getWeekIndexInMonth(test), D: 'DDD', d: 'D', 
    F: Math.ceil(moment(test).date() / 7).toString(), u: 'e', a: 'a', H: 'H', k: 'k',
    K: 'insert function here', h: 'h', m: 'm', s: 's', S: 'S', z: 'Z', Z: 'Z', X: 'Z'}
    let resultString:string = "";
    for (let i = 0; i < dateFormat.length; i++) {
        if (mapList[dateFormat[i]])
            resultString += mapList[dateFormat[i]];
        else {
            if (dateFormat[i] === 'E') {
                if (mapDayName(dateFormat.substring(i)) < 4)
                    resultString += 'ddd'
                else
                    resultString += 'dddd'

                i += mapDayName(dateFormat.substring(i))-1;
            }
            else
                resultString += dateFormat[i];
        }
            
    }
    return resultString;
}

function mapToMoment(dateFormat:string, test:any) {
    let mappedString = ''
    let part:any = ''
    const regexp = /[^']+|('[^']*')/g;
    while (part = regexp.exec(dateFormat as string)) {
        part = part[0]
        if (part.match(/'(.*?)'/))
            mappedString += '[' + part.substring(1, part.length - 1) + ']';
        else
            mappedString += mapPart(part, test);
    }
    return mappedString;
}

export function parseDateFormatCell(dateFormat:string|undefined, test:any) {
    const momentString = mapToMoment(dateFormat as string, test);
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