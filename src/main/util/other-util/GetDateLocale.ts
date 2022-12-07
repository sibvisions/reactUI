/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import * as locales from 'date-fns/locale'
import { addLocale, locale } from 'primereact/api';
import { translation } from './Translation';

const supportedLocales = ["af", "ar", "arDZ", "arMA", "arSA", "az", "be", "bg", "bn", "ca", "cs", "cy", "da", "de", "deAT", "el", "enAU", "enCA", "enGB", "enIN", "enNZ", "enUS", "enZA", "eo", "es", "et", "eu", "faIR", "fi", "fil", "fr", "frCA", "frCH", "gd", "gl", "gu", "he", "hi", "hr", "ht", "hu", "hy", "id", "is", "it", "ja", "ka", "kk", "kk", "kn", "ko", "lb", "lt", "lv", "mk", "mn", "ms", "mt", "nb", "nl", "nlBE", "nn", "pl", "pt", "ptBR", "ro", "ru", "sk", "sl", "sq", "sr", "srLatn", "sv", "ta", "te", "th", "tr", "ug", "uk", "uz", "vi", "zhCN", "zhTW"]

const localeMap = new Map<string, string>().set("ar", "arSA").set("fa", "faIR").set("en", "enUS").set("zh", "zhCN");

let globalLocale:any = locales.enUS;

// A function to build a localizing function, from date-fns (had issues with importing)
function buildLocalizeFn(args:any) {
    return function (dirtyIndex: any, dirtyOptions: any) {
        var options = dirtyOptions || {};
        var context = options.context ? String(options.context) : 'standalone';
        var valuesArray;

        if (context === 'formatting' && args.formattingValues) {
            var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
            var width = options.width ? String(options.width) : defaultWidth;
            valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
        } else {
            var _defaultWidth = args.defaultWidth;

            var _width = options.width ? String(options.width) : args.defaultWidth;

            valuesArray = args.values[_width] || args.values[_defaultWidth];
        }

        var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex;
        return valuesArray[index];
    };
}

// Overwrites the date-fns locale to use our translation file
export function overwriteLocaleValues(locale:string) {
    const eraValues = {
        narrow: [
            translation.get("era-narrow-BC"), 
            translation.get("era-narrow-AD")
        ] as const,
        abbreviated: [
            translation.get("era-abbreviated-BC"), 
            translation.get("era-abbreviated-AD")
        ] as const,
        wide: [
            translation.get("era-wide-BC"), 
            translation.get("era-wide-AD")
        ] as const,
    }
      
    const quarterValues = {
        narrow: [
            translation.get("first-quarter-narrow"), 
            translation.get("second-quarter-narrow"), 
            translation.get("third-quarter-narrow"), 
            translation.get("fourth-quarter-narrow")
        ] as const,
        abbreviated: [
            translation.get("first-quarter-abbreviated"), 
            translation.get("second-quarter-abbreviated"), 
            translation.get("third-quarter-abbreviated"), 
            translation.get("fourth-quarter-abbreviated")
        ] as const,
        wide: [
            translation.get("first-quarter-wide"), 
            translation.get("second-quarter-wide"), 
            translation.get("third-quarter-wide"), 
            translation.get("fourth-quarter-wide")
        ] as const,
    }
    
    const monthValues = {
        narrow: [
            translation.get("month-narrow-January"), 
            translation.get("month-narrow-February"), 
            translation.get("month-narrow-March"), 
            translation.get("month-narrow-April"), 
            translation.get("month-narrow-May"), 
            translation.get("month-narrow-June"), 
            translation.get("month-narrow-July"), 
            translation.get("month-narrow-August"), 
            translation.get("month-narrow-September"), 
            translation.get("month-narrow-October"), 
            translation.get("month-narrow-November"), 
            translation.get("month-narrow-December")
        ] as const,
        abbreviated: [
            translation.get("month-abbreviated-January"), 
            translation.get("month-abbreviated-February"), 
            translation.get("month-abbreviated-March"), 
            translation.get("month-abbreviated-April"), 
            translation.get("month-abbreviated-May"), 
            translation.get("month-abbreviated-June"), 
            translation.get("month-abbreviated-July"), 
            translation.get("month-abbreviated-August"), 
            translation.get("month-abbreviated-September"), 
            translation.get("month-abbreviated-October"), 
            translation.get("month-abbreviated-November"), 
            translation.get("month-abbreviated-December")
        ] as const,
        wide: [
            translation.get("month-wide-January"), 
            translation.get("month-wide-February"), 
            translation.get("month-wide-March"), 
            translation.get("month-wide-April"), 
            translation.get("month-wide-May"), 
            translation.get("month-wide-June"), 
            translation.get("month-wide-July"), 
            translation.get("month-wide-August"), 
            translation.get("month-wide-September"), 
            translation.get("month-wide-October"), 
            translation.get("month-wide-November"), 
            translation.get("month-wide-December")
        ] as const,
      }
      
      const dayValues = {
        narrow: [
            translation.get("day-narrow-Sunday"), 
            translation.get("day-narrow-Monday"), 
            translation.get("day-narrow-Tuesday"), 
            translation.get("day-narrow-Wednesday"), 
            translation.get("day-narrow-Thursday"), 
            translation.get("day-narrow-Friday"), 
            translation.get("day-narrow-Saturday")
        ] as const,
        short: [
            translation.get("day-short-Sunday"), 
            translation.get("day-short-Monday"), 
            translation.get("day-short-Tuesday"), 
            translation.get("day-short-Wednesday"), 
            translation.get("day-short-Thursday"), 
            translation.get("day-short-Friday"), 
            translation.get("day-short-Saturday")
        ] as const,
        abbreviated: [
            translation.get("day-abbreviated-Sunday"), 
            translation.get("day-abbreviated-Monday"), 
            translation.get("day-abbreviated-Tuesday"), 
            translation.get("day-abbreviated-Wednesday"), 
            translation.get("day-abbreviated-Thursday"), 
            translation.get("day-abbreviated-Friday"), 
            translation.get("day-abbreviated-Saturday")
        ] as const,
        wide: [
            translation.get("day-wide-Sunday"), 
            translation.get("day-wide-Monday"), 
            translation.get("day-wide-Tuesday"), 
            translation.get("day-wide-Wednesday"), 
            translation.get("day-wide-Thursday"), 
            translation.get("day-wide-Friday"), 
            translation.get("day-wide-Saturday")
        ] as const,
    }
      
    const dayPeriodValues = {
        narrow: {
            am: translation.get("day-period-narrow-am"),
            pm: translation.get("day-period-narrow-pm"),
            midnight: translation.get("day-period-narrow-midnight"),
            noon: translation.get("day-period-narrow-noon"),
            morning: translation.get("day-period-narrow-morning"),
            afternoon: translation.get("day-period-narrow-afternoon"),
            evening: translation.get("day-period-narrow-evening"),
            night: translation.get("day-period-narrow-night"),
        },
        abbreviated: {
            am: translation.get("day-period-abbreviated-am"),
            pm: translation.get("day-period-abbreviated-pm"),
            midnight: translation.get("day-period-abbreviated-midnight"),
            noon: translation.get("day-period-abbreviated-noon"),
            morning: translation.get("day-period-abbreviated-morning"),
            afternoon: translation.get("day-period-abbreviated-afternoon"),
            evening: translation.get("day-period-abbreviated-evening"),
            night: translation.get("day-period-abbreviated-night"),
        },
        wide: {
            am: translation.get("day-period-wide-am"),
            pm: translation.get("day-period-wide-pm"),
            midnight: translation.get("day-period-wide-midnight"),
            noon: translation.get("day-period-wide-noon"),
            morning: translation.get("day-period-wide-morning"),
            afternoon: translation.get("day-period-wide-afternoon"),
            evening: translation.get("day-period-wide-evening"),
            night: translation.get("day-period-wide-night"),
        },
    }
      
    const formattingDayPeriodValues = {
        narrow: {
            am: translation.get("format-day-period-narrow-am"),
            pm: translation.get("format-day-period-narrow-pm"),
            midnight: translation.get("format-day-period-narrow-midnight"),
            noon: translation.get("format-day-period-narrow-noon"),
            morning: translation.get("format-day-period-narrow-morning"),
            afternoon: translation.get("format-day-period-narrow-afternoon"),
            evening: translation.get("format-day-period-narrow-evening"),
            night: translation.get("format-day-period-narrow-night"),
        },
        abbreviated: {
            am: translation.get("format-day-period-abbreviated-am"),
            pm: translation.get("format-day-period-abbreviated-pm"),
            midnight: translation.get("format-day-period-abbreviated-midnight"),
            noon: translation.get("format-day-period-abbreviated-noon"),
            morning: translation.get("format-day-period-abbreviated-morning"),
            afternoon: translation.get("format-day-period-abbreviated-afternoon"),
            evening: translation.get("format-day-period-abbreviated-evening"),
            night: translation.get("format-day-period-abbreviated-night"),
        },
        wide: {
            am: translation.get("format-day-period-wide-am"),
            pm: translation.get("format-day-period-wide-pm"),
            midnight: translation.get("format-day-period-wide-midnight"),
            noon: translation.get("format-day-period-wide-noon"),
            morning: translation.get("format-day-period-wide-morning"),
            afternoon: translation.get("format-day-period-wide-afternoon"),
            evening: translation.get("format-day-period-wide-evening"),
            night: translation.get("format-day-period-wide-night"),
        },
    }

    const ordinalNumber: any = (
        dirtyNumber:any,
        _options:any
      ) => {
        const number = Number(dirtyNumber)
      
        // If ordinal numbers depend on context, for example,
        // if they are different for different grammatical genders,
        // use `options.unit`.
        //
        // `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
        // 'day', 'hour', 'minute', 'second'.
      
        const rem100 = number % 100
        if (rem100 > 20 || rem100 < 10) {
          switch (rem100 % 10) {
            case 1:
              return number + 'st'
            case 2:
              return number + 'nd'
            case 3:
              return number + 'rd'
          }
        }
        return number + 'th'
    }

    const localize: any = {
        ordinalNumber,
      
        era: buildLocalizeFn({
          values: eraValues,
          defaultWidth: 'wide',
        }),
      
        quarter: buildLocalizeFn({
          values: quarterValues,
          defaultWidth: 'wide',
          argumentCallback: (quarter:any) => (quarter - 1),
        }),
      
        month: buildLocalizeFn({
          values: monthValues,
          defaultWidth: 'wide',
        }),
      
        day: buildLocalizeFn({
          values: dayValues,
          defaultWidth: 'wide',
        }),
      
        dayPeriod: buildLocalizeFn({
          values: dayPeriodValues,
          defaultWidth: 'wide',
          formattingValues: formattingDayPeriodValues,
          defaultFormattingWidth: 'wide',
        }),
    }

    let localeToAdd = locales["enUS"];

    if (supportedLocales.includes(locale)) {
        if (localeMap.has(locale)) {
            //@ts-ignore
            localeToAdd = locales[localeMap.get(locale)];
        }
        else {
            //@ts-ignore
            localeToAdd = locales[locale]
        }
    }

    globalLocale = {
        ...localeToAdd,
        localize: localize
    }
}

// Sets the PrimeReact locale to use our translation file
export function setPrimeReactLocale() {
    addLocale('custom', {
        accept: translation.get('Yes'),
        reject: translation.get('No'),
        choose: translation.get('Choose'),
        upload: translation.get('Upload'),
        cancel: translation.get('Cancel'),
        dayNames: [
            translation.get('day-wide-Sunday'), 
            translation.get('day-wide-Monday'), 
            translation.get('day-wide-Tuesday'), 
            translation.get('day-wide-Wednesday'), 
            translation.get('day-wide-Thursday'), 
            translation.get('day-wide-Friday'), 
            translation.get('day-wide-Saturday')
        ],
        dayNamesShort: [
            translation.get('day-abbreviated-Sunday'), 
            translation.get('day-abbreviated-Monday'), 
            translation.get('day-abbreviated-Tuesday'), 
            translation.get('day-abbreviated-Wednesday'), 
            translation.get('day-abbreviated-Thursday'), 
            translation.get('day-abbreviated-Friday'), 
            translation.get('day-abbreviated-Saturday')
        ],
        dayNamesMin: [
            translation.get('day-short-Sunday'), 
            translation.get('day-short-Monday'), 
            translation.get('day-short-Tuesday'), 
            translation.get('day-short-Wednesday'), 
            translation.get('day-short-Thursday'), 
            translation.get('day-short-Friday'), 
            translation.get('day-short-Saturday')
        ],
        monthNames: [
            translation.get("month-wide-January"),
            translation.get("month-wide-February"),
            translation.get("month-wide-March"),
            translation.get("month-wide-April"),
            translation.get("month-wide-May"),
            translation.get("month-wide-June"),
            translation.get("month-wide-July"),
            translation.get("month-wide-August"),
            translation.get("month-wide-September"),
            translation.get("month-wide-October"),
            translation.get("month-wide-November"),
            translation.get("month-wide-December")
        ],
        monthNamesShort: [
            translation.get("month-abbreviated-January"),
            translation.get("month-abbreviated-February"),
            translation.get("month-abbreviated-March"),
            translation.get("month-abbreviated-April"),
            translation.get("month-abbreviated-May"),
            translation.get("month-abbreviated-June"),
            translation.get("month-abbreviated-July"),
            translation.get("month-abbreviated-August"),
            translation.get("month-abbreviated-September"),
            translation.get("month-abbreviated-October"),
            translation.get("month-abbreviated-November"),
            translation.get("month-abbreviated-December")
        ],
        today: translation.get("Today"),
        clear: translation.get('Delete'),
        weekHeader: translation.get("Weekheader"),
        firstDayOfWeek: parseInt(translation.get("FirstDayOfWeek")),
        dateFormat: 'dd.mm.yyyy',
        weak: translation.get("Weak"),
        medium: translation.get("Medium"),
        strong: translation.get("Strong"),
        passwordPrompt: translation.get("Enter a password")
     });
     locale('custom');
}

export function setDateLocale(locale: string) {
    const splitLocale = locale.split('_')[0];

    let localeToAdd = locales.enUS;

    if (supportedLocales.includes(splitLocale)) {
        if (localeMap.has(splitLocale)) {
            //@ts-ignore
            localeToAdd = locales[localeMap.get(splitLocale)];
        }
        else {
            //@ts-ignore
            localeToAdd = locales[splitLocale]
        }
    }

    globalLocale = {
        ...globalLocale,
        ...localeToAdd
    } 
}

// Returns the globalLocale
export function getDateLocale(locale: string) {
    const splitLocale = locale.split('_')[0];

    let localeToAdd = locales.enUS;

    if (supportedLocales.includes(splitLocale)) {
        if (localeMap.has(splitLocale)) {
            //@ts-ignore
            localeToAdd = locales[localeMap.get(splitLocale)];
        }
        else {
            //@ts-ignore
            localeToAdd = locales[splitLocale]
        }
    }

    return {
        ...globalLocale,
        ...localeToAdd
    }
}

export function getGlobalLocale() {
    return globalLocale;
}