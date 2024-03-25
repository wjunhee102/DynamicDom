let id = 1;
let idStack = [1];
let targetIdList = [];
let endPointId = null;
let targetIdListDepth = 0;
let targetId = null;
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;

class Component {
  props = null;
  id = null;
  state = null;

  constructor() {
    this.setState = this.setState.bind(this);
  }

  setState(callback) {
    this.state = callback(this.state);

    targetIdList = pushTargetIdList(targetIdList, this.id);
    targetId = targetIdList[0].join('-');

    wipRoot = {
      id: currentRoot.id,
      insertPoint: null,
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
      child: currentRoot.child
    }

    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  preRender(id, props) {
    this.id = id;
    this.props = props;
  }

  render() {}
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

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

function commitRoot() {
  deletions.forEach(commitWork);

  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  console.log("idStack", idStack.concat())
  idStack = [];
  targetId = null;
  targetIdList = [];
  targetIdListDepth = 0;
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom;

  if(fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  } else {

    if(fiber.dom) {
      switch(fiber.effectTag) {
        case "PASS":
          break;

        case "PLACEMENT":
        
          if(!fiber.insertPoint) {
            domParent.appendChild(fiber.dom);
          } else {
            const sibling = domParent.childNodes[fiber.insertPoint];

            domParent.insertBefore(fiber.dom, sibling? sibling : null);
            insertPoint = null;
          }
          break;

        case "UPDATE":
          updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
          );
          break;
      }
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }
}

let test = 0;

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function createFiber({
  id,
  index,
  type,
  props,
  insertPoint,
  dom,
  alternate,
  child,
  sibling,
  hooks,
  instance
}) {
  return {
    id,
    index,
    type,
    props,
    insertPoint: insertPoint? insertPoint : null,
    dom: dom? dom : null,
    alternate: alternate? alternate : null,
    child: child? child : null,
    sibling: sibling? sibling : null,
    hooks,
    instance
  }
}

function render(element, container) {
  wipRoot = {
    id: idStack.join('-'),
    index: 0,
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)



function performUnitOfWork(fiber) {
  if(!targetId || (fiber.id && targetId && fiber.id === targetId)) {

    if(fiber.id && targetId && fiber.id === targetId){ 
      console.log("핫 포인트")
      id = fiber.id;
      idStack = id.split('-');
      endPointId = targetId;
      targetId = null;
      fiber.effectTag = "PASS";
      fiber.alternate = Object.assign({}, fiber);
    }
    console.log("재조정");
    const isFunctionComponent =
    fiber.type instanceof Function

    if (isFunctionComponent) {
      if(fiber.type.prototype instanceof Component) {
        updateClassComponent(fiber);
      } else {
        updateFunctionComponent(fiber);
      }
    } else {
      updateHostComponent(fiber)
    }


  } else {
    console.log("반복되지 않음", 1);
    fiber.alternate = Object.assign({}, fiber);
    fiber.effectTag = "PASS";
  }
  
  if (fiber.child) {
    idStack.push(1);

    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {

    if(endPointId && nextFiber.id === endPointId) {
      targetIdListDepth++;
      endPointId = null;
      console.log("엔드 포인트");
  
      if(targetIdList.length <= targetIdListDepth) {
        targetId = "end";
        targetIdList = [];
        targetIdListDepth = 0;
      } else {
        targetId = targetIdList[targetIdListDepth].join('-');
      }
    }

    if (nextFiber.sibling) {

      idStack[idStack.length - 1] += 1;
      return nextFiber.sibling;
    }

    idStack.pop();
    nextFiber = nextFiber.parent;
  }
}

function updateHostComponent(fiber) {
  fiber.id = idStack.join('-');
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children);
}

function updateFunctionComponent(fiber) {
  fiber.id = idStack.join('-');
  wipFiber = fiber;
  hookIndex = 0
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateClassComponent(fiber) {
  fiber.id = idStack.join('-');
  wipFiber = fiber;
  const oldInstance = fiber.alternate && fiber.alternate.instance;

  const instance = oldInstance? oldInstance : new fiber.type();
  fiber.instance = instance;

  instance.preRender(fiber.id, fiber.props);

  const children = [instance.render()];

  reconcileChildren(fiber, children);
}

function pushTargetIdList(targetIdList, targetId) {
  const targetIdStack = targetId.split('-');
  const newTargetIdList = targetIdList.concat();
  const lastIdStack = newTargetIdList[newTargetIdList.length - 1];

  if(!lastIdStack) {
    newTargetIdList.push(targetIdStack);

    return newTargetIdList;
  }

  const targetIdStackLength = targetIdStack.length - 1;
  const lastIdStackLength = lastIdStack.length - 1;

  if(lastIdStackLength === targetIdStackLength) {
    if(lastIdStack.join('-') !== targetId) newTargetIdList.push(targetIdStack);
  } else {
    
    if(targetIdStackLength > lastIdStackLength) {
      newTargetIdList.push(targetIdStack);
    } else {     
      const length = lastIdStackLength - targetIdStackLength;
      const copyLastIdStack = lastIdStack.concat();
    
      for(let i = 0; i < length; i++) {
        copyLastIdStack.pop();
      }

      if(targetId === copyLastIdStack.join('-')) {
        newTargetIdList[newTargetIdList.length - 1] = targetIdStack;
      } else {
        newTargetIdList.push(targetIdStack);
      } 
    }

  }
  console.log(newTargetIdList.concat());
  return newTargetIdList;
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  let hookFiberId = wipFiber.parent.id;

  const actions = oldHook ? oldHook.queue : [];

  if(actions[0]) {
    hook.state = actions[actions.length - 1];
  }

  const setState = value => {
    hook.queue.push(value);
  
    targetIdList = pushTargetIdList(targetIdList, hookFiberId);
    targetId = targetIdList[0].join('-');

    wipRoot = {
      id: currentRoot.id,
      insertPoint: null,
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
      child: currentRoot.child
    }

    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

function useEffect(callback, dependency) {
  const oldHook = wipFiber.alternate
    && wipFiber.alternate.hooks 
    && wipFiber.alternate.hooks[hookIndex];

  if(oldHook) {
    for(let i = 0; i < oldHook.length; i++) {

      if(oldHook[i] !== dependency[i]) {
        const finallyCallback = callback();
  
        if(finallyCallback) finallyCallback();
  
        break;
      }
    }
  }

  wipFiber.hooks.push(dependency);
  hookIndex++;
}

function mapRemainingChildren(child) {
  const exisitingChildrenMap = new Map();

  let existingChild = child;

  while(existingChild) {

    if(!existingChild.key) {
      exisitingChildrenMap.set(existingChild.index, existingChild);
    } else {
      exisitingChildrenMap.set(existingChild.key, existingChild);
    }

    existingChild = existingChild.sibling;
  }

  return exisitingChildrenMap;
}

function reconcileChildren(wipFiber, elements) {
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let firstFiber = null;
  let prevSibling = null;
  let newFiber = null;
  let index = 0;

  for(; oldFiber && index < elements.length; index++) {
    if(oldFiber.key || elements[index].props.key) {
      if(oldFiber.key !== elements[index].props.key) break;
    } 

    if(oldFiber.type === elements[index].type) {
      
      newFiber = {
        id: null,
        index,
        key: elements[index].props.key,
        type: oldFiber.type,
        props: elements[index].props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }

    } else {
      newFiber = {
        id: null,
        insertPoint: wipFiber.insertPoint,
        index,
        key: elements[index].props.key,
        type: elements[index].type,
        props: elements[index].props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
    }

    if(firstFiber) {
      prevSibling.sibling = newFiber;
    } else {
      firstFiber = newFiber;
      wipFiber.child = firstFiber;
    }

    oldFiber = oldFiber.sibling;
    prevSibling = newFiber;
  }

  if(!oldFiber) {

    for(; index < elements.length; index++) {
      
      newFiber = {
        id: null,
        insertPoint: wipFiber.insertPoint,
        index,
        key: elements[index].props.key,
        type: elements[index].type,
        props: elements[index].props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
  
      if(firstFiber) {
        prevSibling.sibling = newFiber;
      } else {
        firstFiber = newFiber;
        wipFiber.child = firstFiber;
      }
  
      prevSibling = newFiber;
    }

  } else {
    const exisitingChildrenMap = mapRemainingChildren(oldFiber);
    let preIndex = 0;

    for(; index < elements.length; index++) {
      const key = elements[index].props.key? elements[index].props.key : index;
      const existingChild = exisitingChildrenMap.get(key);

      if(existingChild) {
        let checkType = false;
        let alternate = null;
        let effectTag = "PLACEMENT";

        if(existingChild.type === elements[index].type) checkType = true;

        if(checkType && preIndex <= existingChild.index) effectTag = "UPDATE";

        if(effectTag === "UPDATE") {
          preIndex = existingChild.index;
          alternate = existingChild;
          exisitingChildrenMap.delete(key);
        }

        newFiber = {
          id: null,
          insertPoint: index,
          index, 
          key: elements[index].props.key,
          type: elements[index].type,
          props: elements[index].props,
          dom: checkType? existingChild.dom : null,
          parent: wipFiber,
          alternate
        }

      } else {

        newFiber = {
          id: null,
          insertPoint: index,
          index,
          key: elements[index].props.key,
          type: elements[index].type,
          props: elements[index].props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: "PLACEMENT"
        }

      }

      if(firstFiber) {
        prevSibling.sibling = newFiber;
      } else {
        firstFiber = newFiber;
        wipFiber.child = firstFiber;
      }

      prevSibling = newFiber;
    
    }

    if(exisitingChildrenMap.size) {
      
      exisitingChildrenMap.forEach(child => {
        child.effectTag = "DELETION";
        deletions.push(child);
      });

    }

  }

}

const Didact = {
  createElement,
  render,
  useState,
}

/** @jsx Didact.createElement */
function Test({ key }) {
  const [ state, setState ] = useState("안녕하세요");

  useEffect(() => {
    console.log(key);
  }, [state]);

  return createElement("div", {
    onClick: () => setState("반갑습니다.")
  }, `${state}`);
}

const test1 = [1, 2, 3, 4];
const test2 = [3, 1, 2, 4];

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = useState(1);

  return createElement(Test2, {  
    onClick: () => { setState(state + 1)}
  },  ...(state > 4?  test2.map(( key ) => createElement(Test3, { state: 3, key }))  : test1.map(( key ) => createElement(Test3, { state: 3, key }))))
}

function Test2({ children, onClick }) {
  return createElement("div", { onClick }, ...children);
}

class Test3 extends Component {

  constructor() {
    super();
    this.state = 1;
  }

  render() {
    const { key } = this.props;

    return createElement("div", {
      onClick: () => this.setState((state) => state + 1),
    }, `connt: ${key} ${this.state}`, createElement(Test, { key }));
  }
}

const element = createElement(Counter, null);
const container = document.getElementById("app");
Didact.render(element, container);

class MyComponent extends HTMLElement {
  connectedCallback() {
    // const $div = document.createElement("div");
    // const $span = document.createElement("span");
    // $div.innerHTML = "난 이걸로 데브매칭에 들어갈거다!";
    // $span.innerHTML = "아자아자아자!";
    // $span.style.color = "#f0f";

    // $div.appendChild($span);
    // this.appendChild($div);
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template1.content.cloneNode(true));
  }
}

// window.customElements.define("my-component", MyComponent);

// const $myComponent = document.createElement("my-component");

// container.appendChild($myComponent);

// const $btn = document.querySelector("button");

// $btn.addEventListener("click", () => {
//   history.pushState(null, null, "/path/ddd");
// });
