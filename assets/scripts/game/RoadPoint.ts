import { _decorator, Component, Enum, Node, Prefab, Vec3 } from "cc";
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

  // @property({
  //   type: Vec3,
  //   displayName: "转弯时候的中心点位置",
  //   visible: function (this: RoadPoint) {
  //     return this.moveType === MoveType.Turn;
  //   },
  // })
  // public centerPoint: Vec3 = new Vec3();

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

  @property({
    type: Prefab,
    displayName: "车类型",
    visible: function (this: RoadPoint) {
      return this.type === RoadPointType.AIStart;
    },
  })
  public carPrefab: Prefab = null;

  public worldPosition: Vec3 = new Vec3();

  public nextRoadPoint: RoadPoint = null;

  protected onLoad(): void {
    this.worldPosition = this.node.getWorldPosition();
    if (this.nextStation) {
      this.nextRoadPoint = this.nextStation.getComponent(RoadPoint);
    }
  }

  start() {}

  update(deltaTime: number) {}
}
