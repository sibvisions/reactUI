export function objectToString(object:any) {
    if (object) {
        Object.keys(object).forEach(k => {
            if (typeof object[k] === 'object') {
              return objectToString(object[k]);
            }
            
            object[k] = '' + object[k];
          });
    }
    return object;
}