import { de } from 'date-fns/locale'

let globalLocale = 'en';
const locales: Record<string, any> = {
    de
};

export function setDateLocale(locale: string) {
    globalLocale = locale.split('-')[0];
}

export function getDateLocale(locale?: string) {
    const loc = locale ? locale.split('-')[0] : globalLocale;
    return locales[loc];
}