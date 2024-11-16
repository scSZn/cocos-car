import { _decorator, Component, Node, ParticleSystemComponent, ParticleUtils, Quat, Vec3 } from "cc";
import { MoveType, RoadPoint, RoadPointType } from "./RoadPoint";
import { CustomEventType, EventHandler } from "../data/EventHandler";
import { AudioManager, AudioName } from "./AudioManager";
const { ccclass, property } = _decorator;

enum MoveLineDirection {
  Turning,
  XPositive,
  XNegative,
  ZPositive,
  ZNegative,
}

const nextPosition: Vec3 = new Vec3();
const turnVec3: Vec3 = new Vec3();
const nextTurnVec3: Vec3 = new Vec3();
const turnQuat: Quat = new Quat();

@ccclass("Car")
export class Car extends Component {
  private currentRoadPoint: RoadPoint = null;

  private isRunning: boolean = false;

  private currentMoveLineDirection: MoveLineDirection = MoveLineDirection.Turning;

  // 转弯时候，旋转路径的半径大小
  private rotateRadius: number = 0;

  private turnCenterPoint: Vec3 = new Vec3();

  private isMainCar = false;

  // 是否在等待乘客中
  private waitingPassenger: boolean = false;

  private accelerateSpeed: number = 0;

  private speed: number = 0;

  private cameraPosition: Vec3 = new Vec3();

  @property({
    type: Node,
    displayName: "尾气特效",
  })
  private gasEffect: Node = null;

  @property({
    type: Node,
    displayName: "金币特效",
  })
  private coinEffect: Node = null;

  @property({
    type: Number,
    displayName: "最大加速度",
  })
  private maxAcceleratedSpeed: number = 0;

  @property({
    type: Number,
    displayName: "最大速度",
  })
  private maxSpeed: number = 2;

  protected onEnable(): void {
    EventHandler.on(CustomEventType.CarRunning, this.carRunning, this);
    EventHandler.on(CustomEventType.CarStop, this.carStop, this);
  }

  protected onDisable(): void {
    EventHandler.off(CustomEventType.CarRunning, this.carRunning, this);
    EventHandler.off(CustomEventType.CarStop, this.carStop, this);
  }

  start() {}

  update(deltaTime: number) {
    this.showEffect();
    if (this.waitingPassenger || !this.isRunning) {
      // 如果在等待乘客，则不能移动
      return;
    }

    this.updateSpeed(deltaTime);
    // 移动小车
    // 1. 获取移动的方向
    switch (this.currentRoadPoint.moveType) {
      case MoveType.Line:
        this.moveLine(deltaTime);
        break;
      case MoveType.Turn:
        this.moveTurn(deltaTime);
        break;
    }
    // 2. 判断是否到达下一个站点
    this.isArravaling();
  }

  public setRoadPoint(roadPoint: RoadPoint) {
    this.currentRoadPoint = roadPoint;
    // 1. 初始化小车在直行时候的移动方向
    if (roadPoint.moveType === MoveType.Line && roadPoint.nextRoadPoint !== null) {
      const nextRoadPoint = roadPoint.nextRoadPoint;
      if (nextRoadPoint.worldPosition.x > roadPoint.worldPosition.x) {
        this.currentMoveLineDirection = MoveLineDirection.XPositive;
      } else if (nextRoadPoint.worldPosition.x < roadPoint.worldPosition.x) {
        this.currentMoveLineDirection = MoveLineDirection.XNegative;
      } else if (nextRoadPoint.worldPosition.z > roadPoint.worldPosition.z) {
        this.currentMoveLineDirection = MoveLineDirection.ZPositive;
      } else if (nextRoadPoint.worldPosition.z < roadPoint.worldPosition.z) {
        this.currentMoveLineDirection = MoveLineDirection.ZNegative;
      }
    }
    // 2. 如果小车下一个节点是在转弯，则在这里初始化转弯大小
    if (roadPoint.moveType === MoveType.Turn && roadPoint.nextRoadPoint !== null) {
      // 1. 判断中心点位置
      switch (this.currentMoveLineDirection) {
        case (MoveLineDirection.XPositive, MoveLineDirection.XNegative):
          // 沿着X轴走的话，中心的X等于当前点的X，Z等于下一个点的Z
          this.turnCenterPoint.x = roadPoint.worldPosition.x;
          this.turnCenterPoint.z = roadPoint.nextRoadPoint.worldPosition.z;
        case (MoveLineDirection.ZPositive, MoveLineDirection.ZNegative):
          // 沿着Z轴走的话，中心的Z等于当前点的Z，X等于下一个点的X
          this.turnCenterPoint.z = roadPoint.worldPosition.z;
          this.turnCenterPoint.x = roadPoint.nextRoadPoint.worldPosition.x;
      }
    }

    const radioVec3: Vec3 = new Vec3();
    Vec3.subtract(radioVec3, this.node.worldPosition, this.turnCenterPoint);
    this.rotateRadius = Vec3.len(radioVec3);

    // 3. 在这里处理小车接送客逻辑
    if (roadPoint.type == RoadPointType.Greeting || roadPoint.type == RoadPointType.Goodbye) {
      this.waitingPassenger = true;
      this.speed = 0;
      if (roadPoint.type == RoadPointType.Goodbye) {
        // 送用户到终点之后，播放金币特效和金币音效
        AudioManager.inst.playOneShot(AudioName.GetMoney);
        AudioManager.inst.playOneShot(AudioName.InCar);
        this.coinEffect?.getComponent(ParticleSystemComponent)?.play();
      }
      EventHandler.on(CustomEventType.PassengerMoveEnd, this.onPassengerMoveEnd, this);
      EventHandler.emit(CustomEventType.PassengerMoveStart, roadPoint);
    }
  }

  /**
   * 小车直行
   * @param dt 时间间隔
   * @returns
   */
  public moveLine(dt: number) {
    // 1. 没有后续站点了，直接返回
    if (this.currentRoadPoint.nextStation === null) {
      return;
    }
    const delta = dt * this.speed;
    // 2. 获取当前的坐标
    const { x, y, z } = this.node.worldPosition;
    // 3. 计算方向，可能有的是x轴移动，也可能是z轴移动
    const nextX = this.currentRoadPoint.nextStation.worldPosition.x;
    const nextZ = this.currentRoadPoint.nextStation.worldPosition.z;

    if (nextX != x) {
      if (nextX > x) {
        nextPosition.x = Math.min(x + delta, nextX);
      } else {
        nextPosition.x = Math.max(x - delta, nextX);
      }
    } else if (nextZ != z) {
      if (nextZ > z) {
        nextPosition.z = Math.min(z + delta, nextZ);
      } else {
        nextPosition.z = Math.max(z - delta, nextZ);
      }
    }
    this.node.setWorldPosition(nextPosition);
  }

  /**
   * 小车转弯
   * @param dt
   * @returns
   */
  public moveTurn(dt: number) {
    // 1. 没有后续站点了，直接返回
    if (this.currentRoadPoint.nextStation === null) {
      return;
    }
    const delta = dt * this.speed;
    // 2. 计算位置
    // 2.2 计算旋转的角度，绕Y轴旋转式，顺时针为负数，逆时针为正数
    let rotateAngles = ((dt * this.speed) / (2 * Math.PI * this.rotateRadius)) * 360;
    // 2.3 角度转弧度
    let rotateRadian = (rotateAngles * Math.PI) / 180;
    if (this.currentRoadPoint.clockwise) {
      rotateRadian = -rotateRadian;
    }

    // 2.4 旋转向量
    Vec3.rotateY(nextPosition, this.node.worldPosition, this.turnCenterPoint, rotateRadian);

    // 2.5 计算位置
    this.node.setWorldPosition(nextPosition);

    // 3. 计算朝向
    // 3.1 用欧拉角实现
    // let eulearAngleX = this.node.eulerAngles.x;
    // let eulearAngleY = this.node.eulerAngles.y;
    // let eulearAngleZ = this.node.eulerAngles.z;
    // if (this.currentRoadPoint.clockwise) {
    //   eulearAngleY = eulearAngleY - rotateAngles;
    // }
    // this.node.setWorldRotationFromEuler(eulearAngleX, eulearAngleY, eulearAngleZ);

    // 3.2 用四元数实现
    Quat.rotateY(turnQuat, this.node.worldRotation, rotateRadian);
    this.node.setWorldRotation(turnQuat);
  }

  public isArravaling() {
    const { x, z } = this.node.worldPosition;
    const nextX = this.currentRoadPoint.nextStation.worldPosition.x;
    const nextZ = this.currentRoadPoint.nextStation.worldPosition.z;

    if ((nextX - x) * (nextX - x) + (nextZ - z) * (nextZ - z) < 0.1) {
      this.setRoadPoint(this.currentRoadPoint.nextRoadPoint);
    }
  }

  // 小车运行的处理函数
  private carRunning() {
    this.isRunning = true;
    this.accelerateSpeed = this.maxAcceleratedSpeed;
    AudioManager.inst.playOneShot(AudioName.Start);
  }

  // 停止小车的处理函数
  private carStop() {
    this.accelerateSpeed = -this.maxAcceleratedSpeed;
    AudioManager.inst.playOneShot(AudioName.Stop);
  }

  // 更新小车速度的函数
  private updateSpeed(deltaTime: number) {
    this.speed += this.accelerateSpeed * deltaTime;
    console.log(this.speed, this.accelerateSpeed, deltaTime);
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < 0) {
      this.speed = 0;
    }
  }

  public setMainCar(isMainCar: boolean) {
    this.isMainCar = isMainCar;
  }

  private onPassengerMoveEnd(roadPoint: RoadPoint) {
    // 1. 播放金币特效
    this.coinEffect?.getComponent(ParticleSystemComponent)?.stop();
    if (roadPoint.type == RoadPointType.Greeting) {
      AudioManager.inst.playOneShot(AudioName.InCar); // 播放音效
    }
    // 2. 移除等待乘客的状态
    this.waitingPassenger = false;
    // 3. 移除监听的事件
    EventHandler.off(CustomEventType.PassengerMoveEnd, this.onPassengerMoveEnd, this);
  }

  private showEffect() {
    if (this.gasEffect) {
      if (this.speed > 0) {
        ParticleUtils.play(this.gasEffect);
      } else {
        ParticleUtils.stop(this.gasEffect);
      }
    }
  }
}
