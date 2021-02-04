import moment from 'moment-timezone'

const mapListPrime:any = {
    N: (val:any) => "'" + moment(val).format('N') + "'",
    Y: () => 'yy',
    YY: () => 'y',
    YYYY: () => 'yy',
    M: () => 'm',
    MM: () => 'mm',
    MMM: () => 'M',
    MMMM : () => 'MM',
    w: (val:any) => "'" + moment(val).format('w') + "'",
    ww: (val:any) => "'" + moment(val).format('ww') + "'",
    DDD: () => 'o',
    DDDD: () => 'oo',
    D: () => 'd',
    DD: () => 'dd',
    ddd: () => 'D',
    dddd: () => 'DD',
    E: (val:any) => "'" + moment(val).format('E') + "'",
    a: (val:any) => "'" + moment(val).format('a') + "'",
    H: (val:any) => "'" + moment(val).format('H') + "'",
    HH: (val:any) => "'" + moment(val).format('HH') + "'",
    k: (val:any) => "'" + moment(val).format('k') + "'",
    kk: (val:any) => "'" + moment(val).format('kk') + "'",
    h: (val:any) => "'" + moment(val).format('h') + "'",
    hh: (val:any) => "'" + moment(val).format('hh') + "'",
    m: (val:any) => "'" + moment(val).format('m') + "'",
    mm: (val:any) => "'" + moment(val).format('mm') + "'",
    s: (val:any) => "'" + moment(val).format('s') + "'",
    ss: (val:any) => "'" + moment(val).format('ss') + "'",
    S: (val:any) => "'" + moment(val).format('S') + "'",
    SS: (val:any) => "'" + moment(val).format('SS') + "'",
    SSS: (val:any) => "'" + moment(val).format('SSS') + "'",
    SSSS: (val:any) => "'" + moment(val).format('SSSS') + "'",
    SSSSS: (val:any) => "'" + moment(val).format('SSSSS') + "'",
    SSSSSS: (val:any) => "'" + moment(val).format('SSSSSS') + "'",
    SSSSSSS: (val:any) => "'" + moment(val).format('SSSSSSS') + "'",
    SSSSSSSS: (val:any) => "'" + moment(val).format('SSSSSSSS') + "'",
    SSSSSSSSS: (val:any) => "'" + moment(val).format('SSSSSSSSS') + "'",
    SSSSSSSSSS: (val:any) => "'" + moment(val).format('SSSSSSSSSS') + "'",
    Z: (val:any) => "'" + moment(val).format('Z') + "'",
    ZZ: (val:any) => "'" + moment(val).format('ZZ')
}

const mapListMoment:any = {
    G: () => 'N', 
    y: (format:string, char:string) => formatYear(format, char, 'Y'), 
    Y: (format:string, char:string) => formatYear(format, char, 'g'), 
    M: (format:string, char:string) => mapJavaToMoment(format, char, 'M', 4), 
    w: (format:string, char:string) => mapJavaToMoment(format, char, 'w', 2),
    W: (format:string, char:string, val:any) => countJavaChar(format, char) > 1 ? addLeadingZeros(countJavaChar(format, char) - 1) + getWeekIndexInMonth(val) : getWeekIndexInMonth(val), 
    D: (format:string, char:string, val:any) => formatDayOfYear(format, char, val), 
    d: (format:string, char:string) => mapJavaToMoment(format, char, 'D', 2),
    F: (format:string, char:string, val:any) => countJavaChar(format, char) > 1 ? addLeadingZeros(countJavaChar(format, char) - 1) + '[' + Math.ceil(moment(val).date() / 7).toString() + ']' : '[' + Math.ceil(moment(val).date() / 7).toString() + ']',
    E: (format:string, char:string) => mapJavaToMoment(format, char, 'd', 3),
    u: (format:string, char:string) => mapJavaToMoment(format, char, 'E', 1),
    a: () => 'a',
    H: (format:string, char:string) => mapJavaToMoment(format, char, 'H', 2),
    k: (format:string, char:string) => mapJavaToMoment(format, char, 'k', 2),
    K: (format:string, char:string, val:any) => mapHourK(format, char, val),
    h: (format:string, char:string) => mapJavaToMoment(format, char, 'h', 2),
    m: (format:string, char:string) => mapJavaToMoment(format, char, 'm', 2),
    s: (format:string, char:string) => mapJavaToMoment(format, char, 's', 2),
    S: (format:string, char:string) => 'S'.repeat(countJavaChar(format, char)), 
    z: (format:string, char:string, val:any) => '[' + new Date(val).toLocaleDateString(undefined, {timeZoneName: countJavaChar(format, char) > 3 ? 'long' : 'short'}).split(', ')[1] + ']',
    Z: () => 'ZZ',
    X: (format:string, char:string, val:any) => mapTimeZoneX(format, char, val)
}

function countJavaChar(dateFormat:string, char:string) {
    let i = 0
    while (dateFormat[i] === char) {
        i++;
    }
    return i;
}

function addLeadingZeros(repeats:number) {
    return '[' + '0'.repeat(repeats) + ']';
}

function mapJavaToMoment(format:string, jChar:string, mChar:string, maxCount:number) {
    if (jChar === 'E') {
        if (countJavaChar(format, jChar) > maxCount)
            return mChar.repeat(4);
        else
            return mChar.repeat(maxCount);
    }
    else if (countJavaChar(format, jChar) > maxCount)
        if (mChar === 'M')
            return mChar.repeat(maxCount)
        else
            return addLeadingZeros(countJavaChar(format, jChar) - maxCount) + mChar.repeat(maxCount);
    else 
        return mChar.repeat(countJavaChar(format, jChar));
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

function mapHourK(format:string, char:string, val:any) {
    if (countJavaChar(format, char) > 2)
        return addLeadingZeros(countJavaChar(format, char)-2) + '[' + moment(val).subtract(1, 'hour').format('hh') + ']';
    else if (countJavaChar(format,char) === 2)
        return '[' + moment(val).subtract(1, 'hour').format('hh') + ']';
    else
        return '[' + moment(val).subtract(1, 'hour').format('h') + ']';
}

function mapTimeZoneX(format:string, char:string, val:any) {
    if (countJavaChar(format, char) === 1)
        return '[' + moment(val).format('Z').substring(0, 2) + ']';
    else if (countJavaChar(format, char) === 2)
        return 'ZZ'
    else
        return 'Z'
}

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

function mapPartPrime(format:string, value:any) {
    let i = 0
    let startIndex:number = -1;
    let lastChar:string|null = null;
    let currentChar:string = "";
    let resultString:string = "";
    for (; i < format.length; i++) {
        currentChar = format.charAt(i);
        if (lastChar === null || lastChar !== currentChar) {
            resultString = appendToPrimeString(format, startIndex, i, resultString, value)
            startIndex = i;
        }
        lastChar = currentChar;
    }
    return appendToPrimeString(format, startIndex, i, resultString, value);
}

function appendToPrimeString(format:string, startIndex:number, currentIndex:number, resultString:string, value:any) {
    if (startIndex !== -1) {
        let tempString = format.substring(startIndex, currentIndex);

        if (mapListPrime[tempString])
            tempString = mapListPrime[tempString].apply(undefined, [value]);
        
        resultString += tempString
    }
    return resultString;
}

function mapPartMoment(dateFormat:string, value:any) {
    let resultString:string = "";
    for (let i = 0; i < dateFormat.length; i++) {
        if (mapListMoment[dateFormat[i]]) {
            resultString += mapListMoment[dateFormat[i]].apply(undefined, [dateFormat.substring(i), dateFormat[i], value]);
            i += countJavaChar(dateFormat.substring(i), dateFormat[i]) - 1;
        }
        else
            resultString += dateFormat[i];
    }
    return resultString;
}

function mapToClientFormat(dateFormat:string, value:any, prime:boolean) {
    let mappedString = ''
    let part:any = ''
    const regexp = prime ? /[^\[\]]+|(\[[^\[\]]*])/g : /[^']+|('[^']*')/g;
    while (part = regexp.exec(dateFormat)) {
        part = part[0]
        if (prime) {
            if (part.match(/\[(.*?)\]/))
                mappedString += "'" + part.substring(1, part.length - 1) + "'";
            else
                mappedString += mapPartPrime(part, value);
        }
        else {
            if (part.match(/'(.*?)'/))
                mappedString += '[' + part.substring(1, part.length - 1) + ']';
            else
                mappedString += mapPartMoment(part, value);
        }
    }
    return mappedString;
}

export function parseDateFormatCell(dateFormat:string|undefined, value:any) {
    const momentString = mapToClientFormat(dateFormat as string, value, false);
    console.log(mapToClientFormat(momentString, value, true))
    return mapToClientFormat(momentString, value, true);
}

export function parseDateFormatTable(dateFormat:string|undefined, value:any) {
    return mapToClientFormat(dateFormat as string, value, false);
}