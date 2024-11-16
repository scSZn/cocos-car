import { _decorator, AssetManager, assetManager, Component, EventHandler, Node } from "cc";
const { ccclass, property } = _decorator;

export enum ResourcePrefix {
  PrefabMap = "prefab/map/map",
  PrefabTaxi = "prefab/taxi/taxi",
}

@ccclass("ResourceUtil")
export class ResourceUtil extends Component {
  private static resource: AssetManager.Bundle = null;

  public static initResource(callback: Function) {
    assetManager.loadBundle("res", (err, bundle) => {
      if (err) {
        console.error("资源包加载失败", err);
        throw err;
      }
      this.resource = bundle;
      if (callback) {
        callback(this.resource);
      }
    });
  }

  public static loadResource<T>(path: string, callback: Function) {
    if (!this.resource) {
      this.initResource(() => {
        this.resource.load(path, (err, asset) => {
          if (err) {
            console.error("资源加载失败", path, err);
            callback(err, null);
          }
          callback(null, asset as T);
        });
      });
      return;
    }
    this.resource.load(path, (err, asset) => {
      if (err) {
        console.error("资源加载失败", path, err);
        callback(err, null);
      }
      callback(null, asset as T);
    });
  }
}
