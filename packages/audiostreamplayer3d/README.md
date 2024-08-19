# AudioStreamPlayer3D

`AudioStreamPlayer3D` is a TypeScript class designed for 3D audio playback in a web environment. It leverages the Web Audio API to manage audio streams, allowing for precise control over spatial audio properties such as position, orientation, volume, and playback rate. It also includes features such as polyphony management and optional audio caching.

## Features

- **3D Audio Positioning:** Set the position and orientation of the audio source in 3D space.
- **Volume and Playback Control:** Easily adjust the volume and playback rate of the audio.
- **Polyphony Management:** Control the maximum number of concurrent audio sources.
- **Audio Caching:** Optionally cache audio files for optimized performance.
- **Looping and Seeking:** Support for looping audio and seeking to specific positions within the track.
- **Disposal and Cleanup:** Proper resource management with the ability to dispose of audio nodes and remove cached data.

## Installation

```bash
npm install @pimdewit/audiostreamplayer3d
yarn add @pimdewit/audiostreamplayer3d
pnpm add @pimdewit/audiostreamplayer3d
bun add @pimdewit/audiostreamplayer3d
```

To use `AudioStreamPlayer3D`, simply import it into your project:

```typescript
import { AudioStreamPlayer3D } from "@pimdewit/audiostreamplayer3d";
```

## Usage

### Creating an Instance

To create an instance of AudioStreamPlayer3D, you need to provide an AudioContext and the path to the audio source. Optionally, you can pass a configuration object:

```typescript
const audioContext = new AudioContext();
const audioPlayer = new AudioStreamPlayer3D(
  audioContext,
  "path/to/audio/file.mp3",
  {
    destination: audioContext.destination,
    useCache: true,
    loop: false,
    volume: 0.8,
    maxPolyphony: 3,
    position: [0, 0, 0],
    orientation: [0, 0, -1],
  }
);
```

### Loading Audio

Before playing audio, you need to load it:

```typescript
await audioPlayer.loadAudio();
```

### Methods

```typescript
audioPlayer.play();
audioPlayer.stop();
audioPlayer.seek(10); // Seek to 10 seconds.
audioPlayer.loop = true; // Enable looping.
audioPlayer.volume = 0.5; // Set volume to 50%.
audioPlayer.playbackRate = 1.5; // 1.5x speed.
// Set the position of the audio source in 3D space.
audioPlayer.position = [10, 5, -2];
audioPlayer.orientation = [0, 1, 0]; // Pointing upwards.
audioPlayer.dispose(true); // Pass true to also remove the buffer from the cache.
```

### Waiting for All Audio to End

If you need to perform an action after all audio instances have naturally ended:

```typescript
await audioPlayer.whenAllEnded();
```

### Connect to Destination

```typescript
const audioContext = new AudioContext();

const globalVolume = audioContext.createGain();
globalVolume.connext(audioContext.destination);

const audioPlayer = new AudioStreamPlayer3D(
  audioContext,
  "path/to/audio/file.mp3",
  {
    destination: globalVolume,
  }
);
```

## API Reference

### Constructor

`constructor(context: AudioContext, sourcePath: string, opts?: Partial<AudioStreamPlayer3DOptions>)`

- **context:** `AudioContext` - The Web Audio API context.
- **sourcePath:** `string` - The path to the audio file.
- **opts:** `Partial<AudioStreamPlayer3DOptions>` - Optional configuration object.

### Methods

- **`loadAudio(): Promise<void>`** - Loads and decodes the audio from the specified source.
- **`play(): Promise<void>`** - Starts playback of the audio.
- **`stop(): void`** - Stops all playing audio sources.
- **`seek(time: number): void`** - Seeks to the specified time in seconds.
- **`whenAllEnded(): Promise<void>`** - Returns a promise that resolves when all audio instances have ended.
- **`dispose(removeFromCache?: boolean): void`** - Disposes of the player, optionally removing the buffer from the cache.

### Properties

- **`loop: boolean`** - Controls whether the audio should loop.
- **`maxPolyphony: number`** - Maximum number of concurrent audio sources.
- **`volume: number`** - Volume of the audio playback.
- **`playbackRate: number`** - Playback rate of the audio.
- **`position: [x: number, y: number, z: number]`** - Position of the audio source in 3D space.
- **`orientation: [x: number, y: number, z: number]`** - Orientation of the audio source in 3D space.
