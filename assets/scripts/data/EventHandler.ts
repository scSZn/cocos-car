import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

interface IEventData {
  func: Function;
  target: any;
}

interface IEventHandlers {
  [eventName: string]: IEventData[];
}

export enum CustomEventType {
  CarRunning = "CarRunning",
  CarStop = "CarStop",
  MapLoaded = "MapLoaded",
  CarLoaded = "CarLoaded",
  GameReady = "GameReady",

  PassengerMoveStart = "PassengerMoveStart",
  PassengerMoveEnd = "PassengerMoveEnd",
}

export class EventHandler {
  private static eventHandlers: IEventHandlers = {};

  public static on(eventName: string, func: Function, target?: any) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push({ func, target });
  }

  public static off(eventName: string, func: Function, target?: any) {
    if (!this.eventHandlers[eventName]) {
      return;
    }
    if (target === null) {
      this.eventHandlers[eventName] = [];
      return;
    }
    this.eventHandlers[eventName] = this.eventHandlers[eventName].filter((eventData) => eventData.func !== func || eventData.target !== target);
  }

  public static emit(eventName: string, ...args: any) {
    if (!this.eventHandlers[eventName]) {
      return;
    }
    this.eventHandlers[eventName].forEach((eventData) => {
      eventData.func.apply(eventData.target, args);
    });
  }
}
