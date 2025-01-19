import { isString } from "lodash-es";
import { NodeType, Node as ProseMirrorNode } from "prosemirror-model";

const internalListNodeTypeName = new Set([
  'bulletList',
  'bullet_list',
  'orderedList',
  'ordered_list',
  'taskList',
  'task_list',
  'todoList',
  'todo_list',
  'checkList',
  'check_list'
]);

const isPMListNodeByName = (nodeType: NodeType) => {
  return internalListNodeTypeName.has(nodeType.name);
};

const isPMListNodeByGroup = (nodeType: NodeType) => {
  const group = nodeType.spec.group;

  return isString(group) && group.split(' ').includes('list');
};

export const isPMListNode = (nodeOrType: ProseMirrorNode | NodeType) => {
  const nodeType = nodeOrType instanceof ProseMirrorNode ? nodeOrType.type : nodeOrType;

  return isPMListNodeByName(nodeType) || isPMListNodeByGroup(nodeType);
};
