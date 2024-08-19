import {
  createGainNode,
  createPannerNode,
  createSourceNode,
  getVolume,
  loadAudioBuffer,
  loadAudioWithCaching,
  setPannerOrientation,
  setPannerPosition,
  setPlaybackRate,
  setVolume,
  streamCache,
} from "./utilities";

export interface AudioStreamPlayer3DOptions {
  // Destination node to connect the gain to.
  destination: AudioNode;
  // Whether to use caching for the audio file.
  useCache: boolean;
  // Initial volume.
  volume: number;
  // How many tracks is this instance allowed to play concurrently.
  maxPolyphony: number;
  // Position in 3D Space.
  position: [x: number, y: number, z: number];
  // Sound orientation.
  orientation: [x: number, y: number, z: number];
}

export class AudioStreamPlayer3D {
  private _loop: boolean = false;
  private _playbackRate: number = 1;
  private _maxPolyphony: number = 1;
  private _offset: number = 0;
  private _endedPromiseResolver: (() => void) | null = null;
  private readonly _useCache: boolean = true;

  readonly pannerNode: PannerNode;
  readonly gainNode: GainNode;
  readonly sources: AudioBufferSourceNode[] = [];
  buffer: AudioBuffer | null = null;

  constructor(
    readonly context: AudioContext,
    readonly sourcePath: string,
    opts: Partial<AudioStreamPlayer3DOptions> = {}
  ) {
    this.pannerNode = createPannerNode(context);
    this.gainNode = createGainNode(context);

    this._useCache = opts.useCache ?? true;
    if (opts.volume !== undefined) this.volume = opts.volume;
    if (opts.maxPolyphony !== undefined) this.maxPolyphony = opts.maxPolyphony;
    if (opts.position !== undefined) this.position = opts.position;
    if (opts.orientation !== undefined) this.orientation = opts.orientation;

    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(opts.destination ?? context.destination);
  }

  /**
   * Loads an audio file from a specified URL and decodes it for playback.
   * Uses caching based on the useCache property.
   * @returns {Promise<AudioBuffer>} A promise that resolves when the audio is loaded and decoded.
   */
  async loadAudio(): Promise<void> {
    const loadMethod = this._useCache ? loadAudioWithCaching : loadAudioBuffer;
    this.buffer = await loadMethod(this.context, this.sourcePath);
  }

  /**
   * Starts playing audio. If no audio is loaded yet, it will attempt to load it first.
   */
  async play() {
    // If there is no buffer, attempt to load it.
    if (!this.buffer) await this.loadAudio();
    // Still no buffer? Exit early.
    if (!this.buffer) return;

    // Manage polyphony.
    if (this.sources.length >= this._maxPolyphony) {
      // Stop the oldest sound.
      const oldestSource = this.sources.shift();
      if (oldestSource) {
        oldestSource.stop(0);
        oldestSource.disconnect();
      }
    }

    const source = createSourceNode(this.context, this.buffer, this.pannerNode);
    source.loop = this._loop;
    source.playbackRate.value = this._playbackRate;

    if (!this._loop) {
      // If not looping, we allow overlapping by pushing the source to the list.
      this.sources.push(source);

      // Remove the source from the list once it ends.
      source.onended = () => {
        const index = this.sources.indexOf(source);
        if (index > -1) this.sources.splice(index, 1);
        if (this.sources.length === 0 && this._endedPromiseResolver) {
          this._endedPromiseResolver();
          this._endedPromiseResolver = null; // Reset the resolver after it has been called.
        }
      };
    } else {
      // If looping, clear previous sources and only keep the current one.
      this.stopAllSources();
      this.sources.push(source);
    }

    source.start(0, this._offset);
  }

  /**
   * Stops all playing audio sources.
   */
  stop() {
    this.stopAllSources();
    this._offset = 0;
  }

  /**
   * Seeks to a specific time in the audio track.
   * @param {number} time - The time in seconds to seek to.
   */
  seek(time: number) {
    if (!this.buffer) return;

    this._offset = time % this.buffer.duration;

    // If currently playing, stop all sources and restart from the new offset
    if (this.sources.length > 0) {
      this.stopAllSources();
      this.play(); // Restart playback from the new offset
    }
  }

  /**
   * Returns a Promise that resolves when all audio instances have ended naturally.
   * @returns {Promise<void>} A promise that resolves when all audio instances have ended.
   */
  whenAllEnded(): Promise<void> {
    if (this.sources.length === 0) {
      return Promise.resolve(); // Resolve immediately if no sources are playing.
    }

    return new Promise((resolve) => {
      this._endedPromiseResolver = resolve;
    });
  }

  /**
   * Disposes of the player, cleaning up all nodes and optionally removing the buffer from the cache.
   * @param {boolean} [removeFromCache=false] - If true, the loaded buffer will be removed from the cache.
   */
  dispose(removeFromCache: boolean = false) {
    this.stopAllSources();

    this.pannerNode.disconnect();
    this.gainNode.disconnect();

    if (removeFromCache && this.sourcePath) streamCache.delete(this.sourcePath);
    this.buffer = null;

    this._loop = false;
    this._playbackRate = 1;
    this._offset = 0;
    this._endedPromiseResolver = null;
  }

  /**
   * Stops all currently playing sources.
   */
  private stopAllSources() {
    for (let index = 0; index < this.sources.length; index++) {
      this.sources[index].stop(0);
      this.sources[index].disconnect();
    }
    this.sources.length = 0;

    if (this._endedPromiseResolver) {
      this._endedPromiseResolver();
      this._endedPromiseResolver = null;
    }
  }

  /**
   * Gets or sets whether the audio should loop when it reaches the end.
   * If false, multiple instances of the same audio can overlap.
   */
  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;

    for (let index = 0; index < this.sources.length; index++) {
      this.sources[index].loop = value;
    }
  }

  /**
   * The maximum number of sounds this node can play at the same time.
   * Playing additional sounds after this value is reached will cut off the oldest sounds.
   */
  get maxPolyphony(): number {
    return this._maxPolyphony;
  }

  set maxPolyphony(value: number) {
    this._maxPolyphony = value;
  }

  /**
   * Gets or sets the volume of the audio playback.
   */
  get volume(): number {
    return getVolume(this.gainNode);
  }

  set volume(value: number) {
    setVolume(this.gainNode, value);
  }

  /**
   * Gets or sets the playback rate of the audio.
   */
  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    this._playbackRate = value;
    for (let index = 0; index < this.sources.length; index++) {
      setPlaybackRate(this.sources[index], value);
    }
  }

  /**
   * Sets the position of the audio source in 3D space.
   */
  set position(value: [x: number, y: number, z: number]) {
    setPannerPosition(this.pannerNode, value[0], value[1], value[2]);
  }

  get position(): [x: number, y: number, z: number] {
    return [
      this.pannerNode.positionX.value,
      this.pannerNode.positionY.value,
      this.pannerNode.positionZ.value,
    ];
  }

  /**
   * Sets the orientation of the audio source in 3D space.
   */
  set orientation(value: [x: number, y: number, z: number]) {
    setPannerOrientation(this.pannerNode, value[0], value[1], value[2]);
  }

  get orientation(): [x: number, y: number, z: number] {
    return [
      this.pannerNode.orientationX.value,
      this.pannerNode.orientationY.value,
      this.pannerNode.orientationZ.value,
    ];
  }
}
