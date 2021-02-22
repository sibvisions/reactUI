/** 3rd Party imports */
import moment from 'moment-timezone'

/** 
 * List to map tokens from moment to PrimeReact calendar tokens if they are not supported by PrimeReact (which is a lot), 
 * format them with moment and put the value between single quotes
*/
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

/** List to map tokens from Java SimpleDateFormat to moment*/
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

/**
 * Returns the amount of times the given char is repeated (no other character between)
 * @param dateFormat - part of the dateFormat
 * @param char - the char to find
 * @returns the amount of times the given char is repeated
 */
function countJavaChar(dateFormat:string, char:string) {
    let i = 0
    while (dateFormat[i] === char) {
        i++;
    }
    return i;
}

/**
 * Returns leading zeros in brackets (for literal text) for moment
 * @param repeats - amount of leading zeros
 * @returns leading zeros in brackets (for literal text) for moment
 */
function addLeadingZeros(repeats:number) {
    return '[' + '0'.repeat(repeats) + ']';
}

/**
 * Returns a part of the date format with the mapped moment tokens from Java tokens
 * @param format - the date format
 * @param jChar - the given Java SimpleDateFormat token
 * @param mChar - the moment token
 * @param maxCount - the max possible amount for a token before leading zeros are added
 * @returns a part of the date format with the mapped moment tokens from Java tokens
 */
function mapJavaToMoment(format:string, jChar:string, mChar:string, maxCount:number) {
    /** Day name e.g. "Monday" if bigger than maxCount 4 because no leading zeros */
    if (jChar === 'E') {
        if (countJavaChar(format, jChar) > maxCount)
            return mChar.repeat(4);
        else
            return mChar.repeat(maxCount);
    }
    else if (countJavaChar(format, jChar) > maxCount)
        /** Month name e.g. "January" no leading zeros */
        if (mChar === 'M')
            return mChar.repeat(maxCount)
        else
            return addLeadingZeros(countJavaChar(format, jChar) - maxCount) + mChar.repeat(maxCount);
    else 
        return mChar.repeat(countJavaChar(format, jChar));
}

/**
 * Returns the part of the date format for year
 * @param format - the date format
 * @param char - the Java char
 * @param replaceChar - the moment char
 */
function formatYear(format:string, char:string, replaceChar:string) {
    if (countJavaChar(format, char) !== 3 && countJavaChar(format, char) < 5)
        return replaceChar.repeat(countJavaChar(format, char));
    /** If count is 3 in Java the year has 4 digits */
    else if (countJavaChar(format, char) === 3)
        return replaceChar.repeat(4);
    else
        return addLeadingZeros(countJavaChar(format, char)-4) + replaceChar.repeat(4)
}

/**
 * Returns the part of the format for day of year
 * @param format - the date format
 * @param char - the Java char
 * @param val - the current date value
 */
function formatDayOfYear(format:string, char:string, val:any) {
    /** If the count of char is 2 and the value is < 10 add a leading zero otherwise 09 would be 9 */
    if (countJavaChar(format, char) === 2 && parseInt(moment(val).format('DDD')) < 10)
        return addLeadingZeros(countJavaChar(format, char)-1) + 'DDD'
    /** no leading zeros 1 is 1, 10 is 10, 100 is 100 */
    else if (countJavaChar(format, char) === 3)
        return 'DDDD'
    else if (countJavaChar(format, char) > 3)
        return addLeadingZeros(countJavaChar(format,char)-3) + 'DDDD'
    else
        return 'DDD'
}

/**
 * Returns the mapping of the Java 'K' token. because moment doesn't support it return it in brackets
 * @param format - the date format
 * @param char - the Java char
 * @param val - the current date value
 * @returns the mapping of the Java 'K' token
 */
function mapHourK(format:string, char:string, val:any) {
    /** Substract 1 hour from 'hh' because according to SimpleDateFormat docs 'K' is 0-11 am/pm and 'hh' is 1-12 am/pm */
    if (countJavaChar(format, char) > 2)
        return addLeadingZeros(countJavaChar(format, char)-2) + '[' + moment(val).subtract(1, 'hour').format('hh') + ']';
    else if (countJavaChar(format,char) === 2)
        return '[' + moment(val).subtract(1, 'hour').format('hh') + ']';
    else
        return '[' + moment(val).subtract(1, 'hour').format('h') + ']';
}

/**
 * Returns the mapping of the Java 'Z' token
 * @param format - the date format
 * @param char - the Java char
 * @param val - the current date value
 */
function mapTimeZoneX(format:string, char:string, val:any) {
    if (countJavaChar(format, char) === 1)
        return '[' + moment(val).format('Z').substring(0, 2) + ']';
    else if (countJavaChar(format, char) === 2)
        return 'ZZ'
    else
        return 'Z'
}

/**
 * Returns the index of the week in its month in brackets. E.g. 22.02.2021 is in the forth week of the month => returns 4
 * @param value - the date value
 * @returns the index of the week in its month
 */
function getWeekIndexInMonth(value:any) {
    const startOfMonth = moment(value).startOf('month');
    const endOfMonth = moment(value).endOf('month');
  
    let currentMomentDate = moment(startOfMonth);
    const weeks = [];
    while (currentMomentDate.isBefore(endOfMonth)) {
      weeks.push(currentMomentDate.week());
      currentMomentDate.add(1, "weeks").startOf("week");
    }
    return '[' + weeks.indexOf(moment(value).week()+1).toString() + ']'
}

/**
 * Returns the given part of the format as PrimeReact tokens
 * @param format - the part of the date format
 * @param value - the current value
 * @returns the given part of the format as PrimeReact tokens
 */
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

/**
 * Returns a string of the moment tokens mapped to the PrimeReact tokens
 * @param format - the part of the date format
 * @param startIndex - the index to start from
 * @param currentIndex - the current index
 * @param resultString - the current resultString of the part to map
 * @param value - the current date value
 * @returns a string of the moment tokens mapped to the PrimeReact tokens
 */
function appendToPrimeString(format:string, startIndex:number, currentIndex:number, resultString:string, value:any) {
    if (startIndex !== -1) {
        let tempString = format.substring(startIndex, currentIndex);

        if (mapListPrime[tempString])
            tempString = mapListPrime[tempString].apply(undefined, [value]);
        
        resultString += tempString
    }
    return resultString;
}

/**
 * Returns a string of the Java tokens mapped to moment tokens
 * @param dateFormat - the part of the date format
 * @param value - the current date value
 * @returns a string of the Java tokens mapped to moment tokens
 */
function mapPartMoment(dateFormat:string, value:any) {
    let resultString:string = "";
    for (let i = 0; i < dateFormat.length; i++) {
        if (mapListMoment[dateFormat[i]]) {
            resultString += mapListMoment[dateFormat[i]].apply(undefined, [dateFormat.substring(i), dateFormat[i], value]);
            /** Increase index to skip already mapped chars */
            i += countJavaChar(dateFormat.substring(i), dateFormat[i]) - 1;
        }
        else
            resultString += dateFormat[i];
    }
    return resultString;
}

/**
 * Returns the complete mapped string for either PrimeReact or moment
 * @param dateFormat - the date format
 * @param value - the current value
 * @param prime - true, if the format should be mapped to PrimeReact
 * @returns the complete mapped string for either PrimeReact or moment
 */
function mapToClientFormat(dateFormat:string, value:any, prime:boolean) {
    let mappedString = ''
    let part:any = ''
    /** RegExp to part tokens from literal strings in the format '[]' in moment "'" in Java */
    const regexp = prime ? /[^[\]]+|(\[[^[\]]*])/g : /[^']+|('[^']*')/g;
    while (part = regexp.exec(dateFormat)) {
        part = part[0]
        if (prime) {
            /** If the part has literal text by moment, put it in single quotes else map it */
            if (part.match(/\[(.*?)\]/))
                mappedString += "'" + part.substring(1, part.length - 1) + "'";
            else
                mappedString += mapPartPrime(part, value);
        }
        else {
            /** If the part has literal text b Java, put it in brackets else map it */
            if (part.match(/'(.*?)'/))
                mappedString += '[' + part.substring(1, part.length - 1) + ']';
            else
                mappedString += mapPartMoment(part, value);
        }
    }
    return mappedString;
}

/**
 * Returns the mapped date format for PrimeReact calendar
 * @param dateFormat - the date format
 * @param value - the current value
 * @returns the mapped date format for PrimeReact calendar
 */
export function parseDateFormatCell(dateFormat:string|undefined, value:any) {
    const momentString = mapToClientFormat(dateFormat as string, value, false);
    return mapToClientFormat(momentString, value, true);
}

/**
 * Returns the mapped date format for moment
 * @param dateFormat - the date format
 * @param value - the current value
 * @returns the mapped date format for moment
 */
export function parseDateFormatTable(dateFormat:string|undefined, value:any) {
    return mapToClientFormat(dateFormat as string, value, false);
}

/**
 * Returns the moment date
 * @param dateFormat - the date format
 * @param value - the current value
 * @returns the moment date
 */
export function getMomentValue(dateFormat:string|undefined, value:any) {
    return moment(value).format(mapToClientFormat(dateFormat as string, value, false));
}