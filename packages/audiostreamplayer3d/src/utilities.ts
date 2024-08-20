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
export async function loadAudio(
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
    buffer = await loadAudio(context, url);
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
