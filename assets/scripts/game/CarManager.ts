import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { ResourcePrefix, ResourceUtil } from "../data/ResourceUtil";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { GameMap } from "./GameMap";
import { Car } from "./Car";
import { RoadPoint } from "./RoadPoint";
import { PoolManager } from "../data/PoolManager";
const { ccclass, property } = _decorator;

@ccclass("CarManager")
export class CarManager extends Component {
  private currentCarNode: Node = null; // 当前车辆节点

  @property({
    type: Node,
    displayName: "相机节点",
  })
  private caremaNode: Node; // 相机节点

  @property({
    type: Prefab,
    displayName: "AI车辆预制体",
  })
  private AICarPrefabs: Prefab[] = []; // AI车辆预制体

  private aiStartNodes: Node[] = []; // AI车辆起始节点

  /**
   * 初始化玩家小车
   * @param carStr 玩家小车
   */
  public initMainCar(carStr: string) {
    if (this.currentCarNode) {
      PoolManager.returnNode(this.currentCarNode);
    }
    // 2.1 车辆资源还未加载，需要加载车辆资源
    ResourceUtil.loadResource<Prefab>(ResourcePrefix.PrefabTaxi + carStr, (err, carPrefab: Prefab) => {
      if (err) {
        console.error("加载车辆资源失败");
        return;
      }
      const carNode = PoolManager.getNode(carPrefab);
      this.currentCarNode = carNode;
      // 3. 加载完成后，挂载到当前车辆节点
      this.mountCurrentCar(carNode);
    });
  }

  /**
   * 初始化AI车辆
   * @param aiStartNodes AI车辆起始节点
   */
  public initAICars(aiStartNodes: Node[]) {
    aiStartNodes.forEach((AIStartNode) => {
      this.initAICar(AIStartNode);
    });
  }

  /**
   * 初始化AI卡车
   * @param AIStartNode AI卡车起始节点
   */
  private initAICar(AIStartNode: Node) {
    const carPrefab = this.AICarPrefabs[Math.floor(Math.random() * this.AICarPrefabs.length)];
    AIStartNode.getComponent(RoadPoint)?.startSchedule(carPrefab);
  }

  start() {
    // 注册游戏结束事件
    EventHandler.on(CustomEventType.GameOver, this.onGameover, this);
  }

  update(deltaTime: number) {}

  /**
   * 挂载当前车辆节点
   * @param currentCarNode 当前车辆
   */
  private mountCurrentCar(currentCarNode: Node, isMainCar = true) {
    currentCarNode.active = false; // 先隐藏
    currentCarNode.getComponent(Car)?.setMainCar(isMainCar);
    this.node.addChild(currentCarNode);

    EventHandler.on(CustomEventType.GameReady, this.gameReady, this);
    EventHandler.emit(CustomEventType.CarLoaded, currentCarNode);
  }

  /**
   *
   * @param gameMapNode 当前游戏地图节点
   * @param carNode 当前车节点
   */
  private gameReady(gameMapNode: Node, carNode: Node): void {
    // 1. 删除当前车辆节点
    // if (this.currentCarNode) {
    //   this.currentCarNode.removeFromParent();
    // }

    this.node.children.forEach((child) => {
      if (child != carNode) {
        child.removeFromParent();
      }
    });

    // 2. 获取到当前地图节点属性，设置车辆节点位置
    const startNode = gameMapNode.getComponent(GameMap)?.startNode;
    if (!startNode) {
      console.error("地图节点没有找到起始点");
      return;
    }
    const originalCameraWorldPosition = this.caremaNode.worldPosition;
    this.caremaNode.setParent(carNode);
    this.caremaNode.setWorldPosition(originalCameraWorldPosition);
    carNode.setWorldPosition(startNode.worldPosition);
    carNode.getComponent(Car)?.setRoadPoint(startNode.getComponent(RoadPoint));
    carNode.getComponent(Car)?.setCameraNode(this.caremaNode);

    // 3. 显示当前车辆节点
    carNode.active = true;
    this.currentCarNode = carNode;
    // 4. 取消游戏准备完毕的事件监听
    EventHandler.off(CustomEventType.GameReady, this.gameReady, this);

    // 5. 初始化车辆
    const aiStartNodes = gameMapNode.getComponent(GameMap)?.AIStartNodes;
    this.aiStartNodes = aiStartNodes;
    this.initAICars(aiStartNodes);
  }

  // 游戏结束事件
  private onGameover() {
    // 1. 暂停产生AI小车
    this.aiStartNodes.forEach((aiStartNode) => {
      aiStartNode.getComponent(RoadPoint)?.stopSchedule();
    });
  }
}
