import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { ResourcePrefix, ResourceUtil } from "../data/ResourceUtil";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { PoolManager } from "../data/PoolManager";
const { ccclass, property } = _decorator;

@ccclass("MapManager")
export class MapManager extends Component {
  private currentGameMapNode: Node = null; // 当前游戏地图

  public initGameMap(gameMapStr: string) {
    if (this.currentGameMapNode) {
      PoolManager.returnNode(this.currentGameMapNode);
    }
    // 2.1 地图资源还未加载，需要加载地图资源
    ResourceUtil.loadResource<Prefab>(ResourcePrefix.PrefabMap + gameMapStr, (err, gameMapPrefab: Prefab) => {
      if (err) {
        console.error("加载地图资源失败");
        return;
      }
      const node = PoolManager.getNode(gameMapPrefab);
      // 3. 加载完成后，挂载到当前地图
      this.mountCurrentGameMap(node);
    });
  }

  start() {}

  update(deltaTime: number) {}

  /**
   * 挂载当前地图节点
   * @param currentGameMapNode 当前游戏地图
   */
  private mountCurrentGameMap(currentGameMapNode: Node) {
    currentGameMapNode.active = false; // 先隐藏当前地图，等待整个游戏准备完毕后再启动
    this.node.addChild(currentGameMapNode);

    EventHandler.on(CustomEventType.GameReady, this.gameReady, this);
    EventHandler.emit(CustomEventType.MapLoaded, currentGameMapNode);
  }

  /**
   * 游戏准备完毕的处理
   */
  private gameReady(currentMapNode: Node, currentCarNode: Node) {
    // 1. 移除其他子节点
    // if (this.currentGameMapNode) {
    //   this.currentGameMapNode.removeFromParent();
    // }
    this.node.children.forEach((child) => {
      if (child !== currentMapNode) {
        child.removeFromParent();
      }
    });

    // 2. 启动当前地图
    currentMapNode.active = true;
    this.currentGameMapNode = currentMapNode;
    // 3. 移除监听
    EventHandler.off(CustomEventType.GameReady, this.gameReady, this);
  }
}
