import { AudioStreamPlayer3D } from "@pimdewit/audiostreamplayer3d";
import backgroundTrack from "./assets/loop.mp3";
import droppedTrack from "./assets/energy.mp3";

const buttonInitialise = document.getElementById(
  "initialise"
) as HTMLButtonElement;

const buttonPlayLoop = document.getElementById(
  "play-loop"
) as HTMLButtonElement;
const buttonPlayDropped = document.getElementById(
  "play-dropped"
) as HTMLButtonElement;
const buttonPlayDroppedOverlapped = document.getElementById(
  "play-dropped-multi"
) as HTMLButtonElement;
const outputDroppedOverlapped = document.getElementById(
  "output-dropped-multi"
) as HTMLOutputElement;

async function initialise() {
  buttonInitialise.disabled = true;

  const audioContext = new AudioContext();

  const sound1 = new AudioStreamPlayer3D(audioContext, backgroundTrack);
  sound1.loop = true;
  sound1.volume = 0.6;

  await sound1.loadAudio();
  function playLoop() {
    sound1.play();
  }
  buttonPlayLoop.disabled = false;
  buttonPlayLoop.addEventListener("click", playLoop);

  const sound2 = new AudioStreamPlayer3D(audioContext, droppedTrack);
  await sound2.loadAudio();
  function playDropped() {
    sound2.play();
  }
  buttonPlayDropped.disabled = false;
  buttonPlayDropped.addEventListener("click", playDropped);

  const sound3 = new AudioStreamPlayer3D(audioContext, droppedTrack);
  sound3.maxPolyphony = 2;
  await sound3.loadAudio();

  console.log(sound1);
  async function playDroppedOverlapped() {
    sound3.play();
    await sound3.whenAllEnded().then(() => {
      outputDroppedOverlapped.textContent += "All sounds ended\n";
    });
  }
  buttonPlayDroppedOverlapped.disabled = false;
  buttonPlayDroppedOverlapped.addEventListener("click", playDroppedOverlapped);
}

buttonInitialise.addEventListener("click", initialise);
