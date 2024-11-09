import { _decorator, Component, Node, Prefab, instantiate, Vec3, Quat, SkeletalAnimation, tween } from "cc";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { RoadPoint, RoadPointType } from "./RoadPoint";
const { ccclass, property } = _decorator;

@ccclass("PassengerManager")
export class PassengerManager extends Component {
  @property({
    type: [Prefab],
    displayName: "乘客预制体",
  })
  public passengerPrefab: Prefab[] = [];

  @property({
    type: Number,
    displayName: "乘客移动的时间",
  })
  public moveTime: number = 0;

  private passengerPool: Node[] = [];

  private passengerStack: Node[] = [];

  private currentPassenger: Node = null;

  private currentStartPoint: Vec3 = null;

  private currentEndPoint: Vec3 = null;

  start() {
    this.node.removeAllChildren();
    // 1. 初始化所有的Prefab，挂载到PassengerManager下，方便随时使用
    for (let i = 0; i < this.passengerPrefab.length; i++) {
      let passenger = instantiate(this.passengerPrefab[i]);
      passenger.parent = this.node;
      passenger.active = false;
      this.passengerPool.push(passenger);
    }

    // 2. 监听乘客到达目的地的事件
    EventHandler.on(CustomEventType.PassengerMoveStart, this.onPassengerMoveStart, this);
  }

  update(deltaTime: number) {
    if (!this.currentPassenger) {
      return;
    }
  }

  private onPassengerMoveStart(roadPoint: RoadPoint) {
    // 1. 参数校验
    if (!roadPoint) {
      console.error("PassengerManager: onPassengerMoveStart roadPoint is null");
      return;
    }
    if (!roadPoint.passengerStartNode) {
      console.error("PassengerManager: onPassengerMoveStart passengerStartNode is null");
      return;
    }
    if (!roadPoint.passengerEndNode) {
      console.error("PassengerManager: onPassengerMoveStart passengerEndNode is null");
      return;
    }

    // 2. 找到乘客节点。判断当前节点状态，如果是接客点，则随机一个乘客，如果是送客点，则需要从栈中取一个
    if (roadPoint.type === RoadPointType.Goodbye) {
      if (this.passengerStack.length === 0) {
        console.error("PassengerManager: onPassengerMoveStart passengerStack is null");
        return;
      }
      this.currentPassenger = this.passengerStack.pop();
    } else {
      this.currentPassenger = this.passengerPool[Math.floor(Math.random() * this.passengerPool.length)];
      if (!this.currentPassenger) {
        console.error("PassengerManager: onPassengerMoveStart currentPassenger is null");
        return;
      }
      this.passengerStack.push(this.currentPassenger);
    }

    // 3. 设置移动的起始位置
    this.currentStartPoint = roadPoint.passengerStartNode.worldPosition;
    this.currentEndPoint = roadPoint.passengerEndNode.worldPosition;

    // 4. 乘客的调整
    this.currentPassenger.setWorldPosition(this.currentStartPoint);
    // 4.1 调整乘客的方向
    let tempVec3: Vec3 = new Vec3();
    Vec3.subtract(tempVec3, this.currentEndPoint, this.currentStartPoint);
    tempVec3 = tempVec3.normalize();
    let tempQuat = new Quat();
    Quat.rotationTo(tempQuat, Vec3.UNIT_Z, tempVec3);
    this.currentPassenger.setWorldRotation(tempQuat);

    // 4.2 乘客开始播放动画
    this.currentPassenger.getComponent(SkeletalAnimation).play("walk");

    // 4.3 激活乘客
    this.currentPassenger.active = true;

    // 5. 开始移动
    tween(this.currentStartPoint)
      .to(
        this.moveTime,
        this.currentEndPoint, // 这里以node的位置信息坐标缓动的目标
        {
          easing: "linear",
          // ITweenOption 的接口实现：
          onUpdate: (target: Vec3, ratio: number) => {
            if (!this.currentPassenger) {
              return;
            }
            this.currentPassenger.setWorldPosition(target); // 将缓动系统计算出的结果赋予 node 的位置
          },
        }
      )
      .call(() => {
        if (!this.currentPassenger) {
          return;
        }
        this.currentPassenger.active = false;
        this.currentPassenger.getComponent(SkeletalAnimation).stop();
        this.currentPassenger = null;
        // 发送事件
        EventHandler.emit(CustomEventType.PassengerMoveEnd);
      })
      .start(); // 调用 start 方法，开启缓动
  }
}
