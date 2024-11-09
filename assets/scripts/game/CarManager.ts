import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { ResourceUtil } from "../data/ResourceUtil";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { GameMap } from "./GameMap";
import { Car } from "./Car";
import { RoadPoint } from "./RoadPoint";
const { ccclass, property } = _decorator;

@ccclass("CarManager")
export class CarManager extends Component {
  private currentCarNode: Node = null; // 当前车辆节点

  private carPool: Map<string, Node> = new Map(); // 车辆池子

  @property({
    type: Node,
    displayName: "相机节点",
  })
  private caremaNode: Node; // 相机节点

  public initMainCar(carStr: string) {
    // 1. 判断当前车辆资源是否加载完成
    const carNode = this.carPool.get(carStr);
    if (!carNode) {
      // 2.1 车辆资源还未加载，需要加载车辆资源
      ResourceUtil.loadResource<Prefab>(carStr, (err, carPrefab: Prefab) => {
        if (err) {
          console.error("加载车辆资源失败");
          return;
        }
        const carNode = instantiate(carPrefab);
        this.carPool.set(carStr, carNode);
        // 3. 加载完成后，挂载到当前车辆节点
        this.mountCurrentCar(carNode);
      });
      return;
    }

    // 2.2 车辆资源已经加载，直接挂载到当前车辆
    this.mountCurrentCar(carNode);
  }

  start() {}

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

    // 3. 显示当前车辆节点
    carNode.active = true;
    this.currentCarNode = carNode;
    // 4. 取消游戏准备完毕的事件监听
    EventHandler.off(CustomEventType.GameReady, this.gameReady, this);
  }
}
