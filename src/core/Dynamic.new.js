import classifyProperty from './utils/classifyProperty';
import { TEXT_ELEMENT } from './utils/contants';

function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: []
    }
  }
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
      )
    },
  }
}


class DynamicDom {
  idStack = [1];
  targetId = null;
  endPointId = null;
  targetIdQueue = null;
  nextUnitOfWork = null;
  currentRoot = null;
  wipRoot = null;
  wipFiber = null;
  hookIndex = null;
  deletions = null;

  constructor() {

  }

  

}

const Dynamic = {
  DynamicDom,
  createElement,
  createTextElement
}


export default Dynamic;