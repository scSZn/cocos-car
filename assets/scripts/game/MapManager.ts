import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { ResourceUtil } from "../data/ResourceUtil";
import { CustomEventType, EventHandler } from "../data/EventHandler";
const { ccclass, property } = _decorator;

@ccclass("MapManager")
export class MapManager extends Component {
  private currentGameMapNode: Node = null; // 当前游戏地图

  private gameMapPoll: Map<string, Node> = new Map(); // 游戏地图池

  public initGameMap(gameMapStr: string) {
    if (this.currentGameMapNode) {
      this.currentGameMapNode.active = false; // 隐藏当前游戏地图
    }
    // 1. 判断当前地图资源是否加载完成
    const gameMap = this.gameMapPoll.get(gameMapStr);
    if (!gameMap) {
      // 2.1 地图资源还未加载，需要加载地图资源
      ResourceUtil.loadResource<Prefab>(gameMapStr, (err, gameMapPrefab: Prefab) => {
        if (err) {
          console.error("加载地图资源失败");
          return;
        }
        const gameMapNode = instantiate(gameMapPrefab);
        this.gameMapPoll.set(gameMapStr, gameMapNode);
        // 3. 加载完成后，挂载到当前地图
        this.mountCurrentGameMap(gameMapNode);
      });
      return;
    }

    // 2.2 地图资源已经加载，直接挂载到当前地图
    this.mountCurrentGameMap(gameMap);
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
