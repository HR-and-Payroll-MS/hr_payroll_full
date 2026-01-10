const setLocalData = (key, value) => {
  if( value === undefined || value === null) return;
  try{localStorage.setItem(key,value); } catch (e) {console.error('error from setLocalData .5 :',e)}
}

const getLocalData = (key) => { try { return localStorage.getItem(key)} catch (e){console.error('error from getlocaldata .5 :',e); return null}}
export {getLocalData,setLocalData}

