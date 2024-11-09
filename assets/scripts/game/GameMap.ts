import { _decorator, Component, Node, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("GameMap")
export class GameMap extends Component {
  @property({
    type: Node,
    displayName: "小车起始点",
  })
  public startNode: Node = null;

  start() {}

  update(deltaTime: number) {}
}
