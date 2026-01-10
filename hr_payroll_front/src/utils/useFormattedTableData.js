import { useMemo } from "react";
import { flattenObject } from "./flattenObject";

export function useFormattedTableData(rawData, bodyStructure, keys) {
    // console.log(rawData)
  const output = (raw, body, key = []) => {
    let resultArray = [];
    // console.log(key)
    switch (body) {
      case 71:
        case 3:
        resultArray.push(raw[key[0]]);
        resultArray.push(raw[key[1]]);
        resultArray.push(raw[key[2]]);
        break;
      case 2:
        resultArray.push(raw[key[0]]);
        resultArray.push(raw[key[1]]);
        break;
      case 1:case 72:case 73: case 74:case 75:case 76:case 77:case 78:case 79: case 81: case 82: case 83:
        resultArray.push(raw[key[0]]);
        break;
      default:
        break;
    }
    return resultArray; 
  };

  const collectedData = useMemo(() => {
    let result = [];  
    rawData.forEach((i) => {
    let flat = flattenObject(i);
      let rowResult = [];
      bodyStructure.forEach((j, iny) => {
        const resultForThisBody = output(flat, j, keys[iny]);
        rowResult.push(resultForThisBody);
      });
      
      rowResult.push(flat?.id) 
      result.push(rowResult);
    });
    return result;
  }, [rawData, bodyStructure, keys]);
  // console.log(collectedData)

  return collectedData;
}
