import { DELETION, PASS, PLACEMENT } from "./contants";
import updateDom from "./updateDom";

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function insertDom(domParent, fiber) {
  if(!fiber.dom) return

  switch(fiber.effectTag) {
    case PASS:
      break;

    case PLACEMENT:
    
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
    
    default:
      throw new Error("commitWork.js 15 line (insertDom): The fiber has no type.");
  }

}

function commitWork(fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;

  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const parentDom = domParentFiber.dom;

  if(fiber.effectTag === DELETION) {
    commitDeletion(fiber, parentDom);
  } else {

    insertDom(domParent, fiber);

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }
}

export default commitWork;