import { _decorator, AudioClip, AudioSource, Component, Node, director } from "cc";
import { ResourceUtil } from "./ResourceUtil";
const { ccclass, property } = _decorator;

export enum AudioName {
  Background = "audio/music/background",
  Click = "audio/sound/click",
  Crash = "audio/sound/crash",
  GetMoney = "audio/sound/getMoney",
  InCar = "audio/sound/inCar",
  NewOrder = "audio/sound/newOrder",
  Start = "audio/sound/start",
  Stop = "audio/sound/stop",
  Tooting1 = "audio/sound/tooting1",
  Tooting2 = "audio/sound/tooting2",
  Win = "audio/sound/win",
}

@ccclass("AudioManager")
export class AudioManager {
  private static _inst: AudioManager;
  public static get inst(): AudioManager {
    if (this._inst == null) {
      this._inst = new AudioManager();
    }
    return this._inst;
  }

  private _audioSource: AudioSource;
  constructor() {
    //@en create a node as audioMgr
    //@zh 创建一个节点作为 audioMgr
    let audioMgr = new Node();
    audioMgr.name = "__audioMgr__";

    //@en add to the scene.
    //@zh 添加节点到场景
    director.getScene().addChild(audioMgr);

    //@en make it as a persistent node, so it won't be destroied when scene change.
    //@zh 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(audioMgr);

    //@en add AudioSource componrnt to play audios.
    //@zh 添加 AudioSource 组件，用于播放音频。
    this._audioSource = audioMgr.addComponent(AudioSource);
  }

  public get audioSource() {
    return this._audioSource;
  }

  /**
   * @en
   * play short audio, such as strikes,explosions
   * @zh
   * 播放短音频,比如 打击音效，爆炸音效等
   * @param sound clip or url for the audio
   * @param volume
   */
  playOneShot(sound: AudioClip | string, volume: number = 1.0) {
    if (sound instanceof AudioClip) {
      this._audioSource.playOneShot(sound, volume);
    } else {
      ResourceUtil.loadResource<AudioClip>(sound, (err, clip: AudioClip) => {
        if (err) {
          console.log(err);
        } else {
          this._audioSource.playOneShot(clip, volume);
        }
      });
    }
  }

  /**
   * @en
   * play long audio, such as the bg music
   * @zh
   * 播放长音频，比如 背景音乐
   * @param sound clip or url for the sound
   * @param volume
   */
  play(sound: AudioClip | string, volume: number = 1.0) {
    if (sound instanceof AudioClip) {
      this._audioSource.stop();
      this._audioSource.clip = sound;
      this._audioSource.play();
      this.audioSource.volume = volume;
    } else {
      ResourceUtil.loadResource<AudioClip>(sound, (err, clip: AudioClip) => {
        if (err) {
          console.log(err);
        } else {
          this._audioSource.stop();
          this._audioSource.clip = clip;
          this._audioSource.play();
          this.audioSource.volume = volume;
        }
      });
    }
  }

  /**
   * stop the audio play
   */
  stop() {
    this._audioSource.stop();
  }

  /**
   * pause the audio play
   */
  pause() {
    this._audioSource.pause();
  }

  /**
   * resume the audio play
   */
  resume() {
    this._audioSource.play();
  }
}