import { _decorator, Component, Enum, macro, Node, Prefab, Vec3 } from "cc";
import { PoolManager } from "../data/PoolManager";
import { Car } from "./Car";
const { ccclass, property } = _decorator;

export enum RoadPointType {
  Normal = 1,
  Start,
  End,
  Greeting,
  Goodbye,

  AIStart,
}
Enum(RoadPointType);

export enum DirectionType {
  None = 0,
  Left,
  Right,
}
Enum(DirectionType);

export enum MoveType {
  Line = 0,
  Turn,
}
Enum(MoveType);

@ccclass("RoadPoint")
export class RoadPoint extends Component {
  @property({
    type: RoadPointType,
    displayName: "站点类型",
  })
  public type: RoadPointType = RoadPointType.Normal;

  @property({
    type: Node,
    displayName: "下一个站点",
    visible: function (this: RoadPoint) {
      return this.type !== RoadPointType.End;
    },
  })
  public nextStation: Node = null;

  @property({
    type: Node,
    displayName: "乘客起始点",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.Greeting || this.type === RoadPointType.Goodbye;
    },
  })
  public passengerStartNode: Node;

  @property({
    type: Node,
    displayName: "乘客结束点",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.Greeting || this.type === RoadPointType.Goodbye;
    },
  })
  public passengerEndNode: Node;

  @property({
    type: MoveType,
    displayName: "移动方式（直行还是转弯）",
    visible: function (this: RoadPoint) {
      return this.type !== RoadPointType.End;
    },
  })
  public moveType: MoveType = MoveType.Line;

  @property({
    type: Boolean,
    displayName: "顺时针转弯",
    visible: function (this: RoadPoint) {
      return this.moveType === MoveType.Turn;
    },
  })
  public clockwise: boolean = false;

  @property({
    type: Number,
    displayName: "产生的间隔时间",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.AIStart;
    },
  })
  public interval: number = 0;

  @property({
    type: Number,
    displayName: "发车延迟时间",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.AIStart;
    },
  })
  public delayTime: number = 0;

  @property({
    type: Number,
    displayName: "发车速度",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.AIStart;
    },
  })
  public speed: number = 0;

  public worldPosition: Vec3 = new Vec3();

  public nextRoadPoint: RoadPoint = null;

  private currentTrunkPrefab: Prefab = null;

  protected onLoad(): void {
    this.worldPosition = this.node.getWorldPosition();
    if (this.nextStation) {
      this.nextRoadPoint = this.nextStation.getComponent(RoadPoint);
    }
  }

  protected onDisable(): void {
    this.unschedule(this.produceTrunk);
  }

  start() {}

  update(deltaTime: number) {}

  /**
   * 开始产生卡车
   * @param carPrefab 车辆预制体
   */
  public startSchedule(carPrefab: Prefab) {
    if (this.type !== RoadPointType.AIStart) {
      return;
    }
    this.currentTrunkPrefab = carPrefab;
    this.schedule(this.produceTrunk, this.interval, macro.REPEAT_FOREVER, this.delayTime);
  }

  // 停止产生卡车
  public stopSchedule() {
    this.unschedule(this.produceTrunk);
  }

  // 产生卡车
  private produceTrunk(): void {
    const carNode = PoolManager.getNode(this.currentTrunkPrefab, this.node);
    carNode.setWorldPosition(this.worldPosition);
    const carComponent = carNode.getComponent(Car);
    carComponent.setSpeed(this.speed);
    carComponent.setRoadPoint(this);
    carComponent.carRunning();
  }
}
