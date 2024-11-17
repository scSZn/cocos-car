import { _decorator, Component, director, Node, PhysicsSystem, Prefab, SystemEvent } from "cc";
import { MapManager } from "./MapManager";
import { CarManager } from "./CarManager";
import { ResourceUtil } from "../data/ResourceUtil";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { AudioManager, AudioName } from "../data/AudioManager";

const { ccclass, property } = _decorator;

@ccclass("GameCtrl")
export class GameCtrl extends Component {
  @property({
    type: MapManager,
  })
  private mapManager: MapManager = null;

  @property({
    type: CarManager,
  })
  private carManager: CarManager = null;

  @property({
    type: String,
    displayName: "当前地图Prefab名称",
  })
  private currentGameMap: string;

  @property({
    type: String,
    displayName: "当前使用车辆Prefab名称",
  })
  private currentCar: string;

  // Game是否准备就绪
  private ready: boolean = false;

  private currentMapNode: Node = null;

  private currentCarNode: Node = null;

  protected onLoad(): void {
    ResourceUtil.initResource(null);
    PhysicsSystem.instance.enable = true;

    // 注册监听事件
    this.node.on(SystemEvent.EventType.TOUCH_START, this.setCarRunning, this);
    this.node.on(SystemEvent.EventType.TOUCH_END, this.setCarStop, this);
    EventHandler.on(CustomEventType.MapLoaded, this.setMapLoaded, this);
    EventHandler.on(CustomEventType.CarLoaded, this.setCarLoaded, this);

    this.mapManager.initGameMap(this.currentGameMap);
    this.carManager.initMainCar(this.currentCar);
    AudioManager.inst.play(AudioName.Background); // 播放背景音乐
  }

  /**
   * 设置车辆运行状态
   */
  private setCarRunning(): void {
    if (!this.ready) {
      return;
    }
    EventHandler.emit(CustomEventType.CarRunning);
  }

  /**
   * 设置车辆停止状态
   */
  private setCarStop(): void {
    if (!this.ready) {
      return;
    }
    EventHandler.emit(CustomEventType.CarStop);
  }

  // 地图加载完成
  private setMapLoaded(gameMapNode: Node): void {
    this.currentMapNode = gameMapNode;
    this.checkReady();
  }

  // 车辆加载完成
  private setCarLoaded(carNode: any): void {
    this.currentCarNode = carNode;
    this.checkReady();
  }

  // 检查是否可以开始游戏
  private checkReady(): void {
    // console.log("checkReady", this.currentCarNode !== null, this.currentMapNode !== null, this.currentCarNode, this.currentMapNode);
    this.ready = this.currentMapNode !== null && this.currentCarNode !== null;
    if (this.ready) {
      EventHandler.emit(CustomEventType.GameReady, this.currentMapNode, this.currentCarNode);
    }
  }
}
