import { LatLngExpression } from "leaflet";

export function sortGroupDataOSM(groupData:any[], gColName:string|undefined, latColName:string|undefined, lngColName:string|undefined):any[] {
    const groupArray:any[] = [];
    groupData.forEach((groupPoint:any) => {
        const foundGroup = findGroup(groupArray, gColName, groupPoint);
        if (foundGroup) {
            const tempPoint:LatLngExpression = [latColName ? groupPoint[latColName] : groupPoint.LATITUDE, lngColName ? groupPoint[lngColName] : groupPoint.LONGITUDE];
            foundGroup.positions.push(tempPoint);
        }
        else {
            const temp:any = {
                GROUP: gColName ? groupPoint[gColName] : groupPoint.GROUP, 
                positions: [
                    [latColName ? groupPoint[latColName] : groupPoint.LATITUDE, lngColName ? groupPoint[lngColName] : groupPoint.LONGITUDE]]
            };
            groupArray.push(temp);
        }
    });
    return groupArray
}

export function sortGroupDataGoogle(groupData:any[], gColName:string|undefined, latColName:string|undefined, lngColName:string|undefined):any[] {
    const groupArray:any[] = [];
    groupData.forEach((groupPoint:any) => {
        const foundGroup = findGroup(groupArray, gColName, groupPoint);
        if (foundGroup) {
            const tempPoint = {lat: latColName ? groupPoint[latColName] : groupPoint.LATITUDE, lng: lngColName ? groupPoint[lngColName] : groupPoint.LONGITUDE};
            foundGroup.paths.push(tempPoint);
        }
        else {
            const temp:any = {
                GROUP: gColName ? groupPoint[gColName] : groupPoint.GROUP,
                paths: [{lat: latColName ? groupPoint[latColName] : groupPoint.LATITUDE, lng: lngColName ? groupPoint[lngColName] : groupPoint.LONGITUDE}]
            };
            groupArray.push(temp)
        }
    });
    return groupArray
}

function findGroup(groupArray:any[], gColName:string|undefined, groupPoint:any) {
    const found = groupArray.find(existingGroup => {
        if (gColName) {
            return existingGroup.GROUP === groupPoint[gColName];
        }
        else
            return existingGroup.GROUP === groupPoint.GROUP
    });
    return found;
}