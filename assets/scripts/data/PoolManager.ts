import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { ResourceUtil } from "./ResourceUtil";
const { ccclass, property } = _decorator;

@ccclass("PoolManager")
export class PoolManager {
  private static pool: Map<string, Node[]> = new Map();

  public static getNode(prefab: Prefab, parent?: Node): Node {
    const name = prefab.name;
    // 1. 判断是否有这个节点池
    if (!this.pool.has(name)) {
      this.pool.set(name, []);
    }
    // 2. 判断节点池中是否有节点
    let node = this.pool.get(name).pop();
    if (!node) {
      // 没有节点则创建;
      node = instantiate(prefab);
    }
    // 3. 节点赋值
    node.name = name;
    if (parent) {
      node.parent = parent;
    }
    return node;
  }

  public static returnNode(node: Node) {
    const name = node.name;
    node.removeFromParent();
    if (this.pool.has(name) && this.pool.get(name).length < 100) {
      this.pool.get(name).push(node);
    }
  }
}
