import classifyProperty from "./classifyProperty";

function updateDom(dom, prevProps, nextProps) {
  const {
    toRemoveEventKeyList,
    toRemovePropsKeyList,
    toAddPropsKeyList,
    toAddEventKeyList
  } = classifyProperty(prevProps, nextProps);

  toRemoveEventKeyList.forEach(key => {
    const eventType = key
        .toLowerCase()
        .substring(2)
    dom.removeEventListener(
      eventType,
      prevProps[key]
    );
  });

  toRemovePropsKeyList.forEach(key => {
    dom[key] = "";
  });

  toAddPropsKeyList.forEach(key => {
    dom[key] = nextProps[key];
  });

  toAddEventKeyList.forEach(key => {
    const eventType = key
        .toLowerCase()
        .substring(2);
    dom.addEventListener(eventType, nextProps[key]);
  });
}

export default updateDom;