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
    return '[' + weeks.indexOf(moment(day).week()+1).toString() + ']'
}

function countJavaChar(dateFormat:string, char:string) {
    let i = 0
    while (dateFormat[i] === char) {
        i++;
    }
    return i;
}

function mapJavaToMoment(format:string, jChar:string, mChar:string, maxCount:number) {
    if (jChar === 'E') {
        if (countJavaChar(format, jChar) > maxCount)
            return mChar.repeat(maxCount);
        else
            return mChar.repeat(4);
    }
    else if (countJavaChar(format, jChar) > maxCount)
        if (mChar === 'M')
            return mChar.repeat(maxCount)
        else
            return addLeadingZeros(countJavaChar(format, jChar) - maxCount) + mChar.repeat(maxCount);
    else
        return mChar.repeat(countJavaChar(format, jChar));
}

const mapList:any = {
    G: () => 'N', 
    y: (format:string, char:string) => formatYear(format, char, 'Y'), 
    Y: (format:string, char:string) => formatYear(format, char, 'g'), 
    M: (format:string, char:string) => mapJavaToMoment(format, char, 'M', 4), 
    w: (format:string, char:string) => mapJavaToMoment(format, char, 'w', 2),
    W: (format:string, char:string, val:any) => countJavaChar(format, char) > 1 ? addLeadingZeros(countJavaChar(format, char) - 1) + getWeekIndexInMonth(val) : getWeekIndexInMonth(val), 
    D: (format:string, char:string, val:any) => formatDayOfYear(format, char, val), 
    d: (format:string, char:string) => mapJavaToMoment(format, char, 'd', 2),
    F: (format:string, char:string, val:any) => countJavaChar(format, char) > 1 ? addLeadingZeros(countJavaChar(format, char) - 1) + '[' + Math.ceil(moment(val).date() / 7).toString() + ']' : '[' + Math.ceil(moment(val).date() / 7).toString() + ']',
    E: (format:string, char:string) => mapJavaToMoment(format, char, 'd', 3),
    u: (format:string, char:string) => mapJavaToMoment(format, char, 'E', 1),
    a: () => 'a',
    H: (format:string, char:string) => mapJavaToMoment(format, char, 'H', 2),
    k: (format:string, char:string) => mapJavaToMoment(format, char, 'k', 2),
    h: (format:string, char:string) => mapJavaToMoment(format, char, 'h', 2),
    m: (format:string, char:string) => mapJavaToMoment(format, char, 'm', 2),
    s: (format:string, char:string) => mapJavaToMoment(format, char, 's', 2),
    S: 'S', 
    z: 'Z', 
    Z: 'Z', 
    X: 'Z'
}

const extraMap: any = {
    
    K: (format:string, char:string, val:any) => '[' + (countJavaChar(format, char) < 2 ? moment(val).subtract(1, 'hour').format('h') : moment(val).subtract(1, 'hour').format('hh')) + ']'
}

function addLeadingZeros(repeats:number) {
    return '[' + '0'.repeat(repeats) + ']';
}

function formatYear(format:string, char:string, replaceChar:string) {
    if (countJavaChar(format, char) !== 3 && countJavaChar(format, char) < 5)
        return replaceChar.repeat(countJavaChar(format, char));
    else if (countJavaChar(format, char) === 3)
        return replaceChar.repeat(4);
    else
        return addLeadingZeros(countJavaChar(format, char)-4) + replaceChar.repeat(4)
}

function formatDayOfYear(format:string, char:string, val:any) {
    if (countJavaChar(format, char) === 2 && parseInt(moment(val).format('DDD')) < 10)
        return addLeadingZeros(countJavaChar(format, char)-1) + 'DDD'
    else if (countJavaChar(format, char) === 3)
        return 'DDDD'
    else if (countJavaChar(format, char) > 3)
        return addLeadingZeros(countJavaChar(format,char)-3) + 'DDDD'
    else
        return 'DDD'
}

function mapPart(dateFormat:string, test:any) {
    let resultString:string = "";
    for (let i = 0; i < dateFormat.length; i++) {
        if (mapList[dateFormat[i]]) {
            if(typeof mapList[dateFormat[i]] === 'function') {
                resultString += mapList[dateFormat[i]].apply(undefined, [dateFormat.substring(i), dateFormat[i], test]);
                i += countJavaChar(dateFormat.substring(i), dateFormat[i]) - 1;
            }
            else {
                resultString += mapList[dateFormat[i]];
                i += countJavaChar(dateFormat.substring(i), dateFormat[i]) - 1;
            }
                
        }
            
        else if (extraMap[dateFormat[i]]) {
            resultString += extraMap[dateFormat[i]].apply(undefined, [dateFormat.substring(i), dateFormat[i], test])
            i += countJavaChar(dateFormat.substring(i), dateFormat[i]) - 1;
        }
        else
            resultString += dateFormat[i];
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
        else {
            mappedString += mapPart(part, test);
        }
    }
    console.log(mappedString)
    return mappedString;
}

function prepareMapping(format:string) {
    let newFormat = ''
    for (let i = 0; i < format.length; i++) {
        console.log(format.substring(i))
        if (format[i] === 'G') {
            newFormat += format.substring(i, i+1);
            i += countJavaChar(format.substring(i), format[i])-1;
        }
        else
            newFormat += format[i];
    }
    console.log(newFormat)
    return newFormat;
}

export function parseDateFormatCell(dateFormat:string|undefined, test:any) {
    //const formatTest = prepareMapping(dateFormat as string);
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