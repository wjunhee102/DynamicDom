function classifyProperty(preProps, newProps) {
  const toRemoveEventKeyList = [];
  const toRemovePropsKeyList = [];
  const toAddEventKeyList = [];
  const toAddPropsKeyList = [];

  for(const key in preProps) {
    if(key === "key" || key === "children") continue;

    if(key.startsWith("on")) {

      if(newProps[key]) {
        if(preProps[key] !== newProps[key]) {
          toRemoveEventKeyList.push(key);
          toAddEventKeyList.push(key);
        }
      } else {
        toRemoveEventKeyList.push(key);
      }

    } else {

      if(newProps[key]) {
        if(preProps[key] !== newProps[key]) {
          toRemovePropsKeyList.push(key);
          toAddPropsKeyList.push(key);
        }
      } else {
        toRemovePropsKeyList.push(key);
      }

    }
  } 

  for(const key in newProps) {
    if(key === "key" || key === "children" || preProps[key]) continue;

    if(key.startsWith("on")) {

      if(!toRemoveEventKeyList.includes(key) 
      && !toAddEventKeyList.includes(key)
      ) {
        toAddEventKeyList.push(key);
      }

    } else {
      if(!toRemovePropsKeyList.includes(key) 
      && !toAddPropsKeyList.includes(key)
      ) {
        toAddPropsKeyList.push(key);
      }
    }
  }

  return {
    toRemoveEventKeyList,
    toRemovePropsKeyList,
    toAddEventKeyList,
    toAddPropsKeyList
  }
}

export default classifyProperty