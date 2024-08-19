/**
 * A simple cache for storing decoded AudioBuffer objects.
 * The key is the URL of the audio file, and the value is the corresponding AudioBuffer.
 */
export const streamCache = new Map<string, AudioBuffer>();

/**
 * Loads an audio buffer from the specified URL.
 * @param {AudioContext} context - The AudioContext to use for decoding the audio data.
 * @param {string} url - The URL of the audio file to load.
 * @param {typeof window.fetch} fetch - Fetch method.
 * @returns {Promise<AudioBuffer>} A promise that resolves with the decoded AudioBuffer.
 */
export async function loadAudioBuffer(
  context: AudioContext,
  url: string,
  fetch = window.fetch
): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}

/**
 * Loads an audio buffer from the specified URL, using the cache if available.
 * @param {AudioContext} context - The AudioContext to use for decoding the audio data.
 * @param {string} url - The URL of the audio file to load.
 * @returns {Promise<AudioBuffer>} A promise that resolves with the decoded AudioBuffer.
 */
export async function loadAudioWithCaching(
  context: AudioContext,
  url: string
): Promise<AudioBuffer> {
  let buffer = streamCache.get(url);

  if (!buffer) {
    buffer = await loadAudioBuffer(context, url);
    streamCache.set(url, buffer);
  }

  return buffer;
}

/**
 * Creates and configures a PannerNode for 3D audio.
 * @param {AudioContext} context - The AudioContext to use for creating the PannerNode.
 * @returns {PannerNode} The created and configured PannerNode.
 */
export function createPannerNode(context: AudioContext): PannerNode {
  const panner = context.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 10000;
  panner.rolloffFactor = 1;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 0;
  panner.coneOuterGain = 0;
  return panner;
}

/**
 * Creates a GainNode for controlling audio volume.
 * @param {AudioContext} context - The AudioContext to use for creating the GainNode.
 * @returns {GainNode} The created GainNode.
 */
export function createGainNode(context: AudioContext): GainNode {
  return context.createGain();
}

/**
 * Creates an AudioBufferSourceNode and attaches it to the given PannerNode.
 * @param {AudioContext} context - The AudioContext to use for creating the source.
 * @param {AudioBuffer} buffer - The AudioBuffer to play.
 * @param {PannerNode} panner - The PannerNode to connect the source to.
 * @returns {AudioBufferSourceNode} The created and connected AudioBufferSourceNode.
 */
export function createSourceNode(
  context: AudioContext,
  buffer: AudioBuffer,
  panner: PannerNode
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(panner);
  return source;
}

/**
 * Sets the position of the PannerNode in 3D space.
 * Replaces the deprecated setPosition method with direct property assignments.
 * @param {PannerNode} panner - The PannerNode to set the position on.
 * @param {number} x - The X coordinate of the audio source.
 * @param {number} y - The Y coordinate of the audio source.
 * @param {number} z - The Z coordinate of the audio source.
 */
export function setPannerPosition(
  panner: PannerNode,
  x: number,
  y: number,
  z: number
): void {
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;
}

/**
 * Sets the orientation of the PannerNode in 3D space.
 * Replaces the deprecated setOrientation method with direct property assignments.
 * @param {PannerNode} panner - The PannerNode to set the orientation on.
 * @param {number} x - The X direction of the audio source.
 * @param {number} y - The Y direction of the audio source.
 * @param {number} z - The Z direction of the audio source.
 */
export function setPannerOrientation(
  panner: PannerNode,
  x: number,
  y: number,
  z: number
): void {
  panner.orientationX.value = x;
  panner.orientationY.value = y;
  panner.orientationZ.value = z;
}

/**
 * Sets the volume of a GainNode.
 * @param {GainNode} gainNode - The GainNode to set the volume on.
 * @param {number} volume - The volume level.
 */
export function setVolume(gainNode: GainNode, volume: number) {
  gainNode.gain.setValueAtTime(volume, gainNode.context.currentTime);
}

/**
 * Gets the volume of a GainNode.
 * @param {GainNode} gainNode - The GainNode to get the volume from.
 */
export function getVolume(gainNode: GainNode) {
  return gainNode.gain.value;
}

/**
 * Sets the playback rate of an AudioBufferSourceNode.
 * @param {AudioBufferSourceNode} source - The source to set the playback rate on.
 * @param {number} rate - The playback rate.
 */
export function setPlaybackRate(source: AudioBufferSourceNode, rate: number) {
  source.playbackRate.setValueAtTime(rate, source.context.currentTime);
}
