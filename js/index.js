const videoElement = document.getElementsByClassName('input_video5')[0];
const canvasElement = document.getElementsByClassName('output5')[0];
const controlsElement5 = document.getElementsByClassName('control5')[0];
const canvasCtx5 = canvasElement.getContext('2d');

const fpsControl = new FPS();

const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};


function calculateAngle(p1, p2, p3) {
  const a = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
  const b = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));
  const c = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const angle = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / Math.PI; // Angle in degrees

  return angle;
}



function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

function onResultsPose(results) {
  document.body.classList.add('loaded');
  fpsControl.tick();

  // Draw the overlays
  canvasCtx5.save();
  canvasCtx5.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx5.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.poseLandmarks) {
    drawingUtils.drawConnectors(
        canvasCtx5, results.poseLandmarks, pose.POSE_CONNECTIONS,
        {visibilityMin: 0.65, color: 'white'});
    drawingUtils.drawLandmarks(
        canvasCtx5,
        Object.values(pose.POSE_LANDMARKS_LEFT)
            .map(index => results.poseLandmarks[index]),
        {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)'});
    drawingUtils.drawLandmarks(
        canvasCtx5,
        Object.values(pose.POSE_LANDMARKS_RIGHT)
            .map(index => results.poseLandmarks[index]),
        {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)'});
    drawingUtils.drawLandmarks(
        canvasCtx5,
        Object.values(pose.POSE_LANDMARKS_NEUTRAL)
            .map(index => results.poseLandmarks[index]),
        {visibilityMin: 0.65, color: 'white', fillColor: 'white'});
  }
  canvasCtx5.restore();
    
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
}});
pose.onResults(onResultsPose);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 480,
  height: 480
});
camera.start();

new ControlPanel(controlsElement5, {
  cameraMode: true,
  effect: 'background',
})
.add([
  new StaticText({title: 'Options'}),
  fpsControl,
  new Toggle({title: 'Camera mode', field: 'cameraMode'}),
  new SourcePicker({
    onSourceChanged: () => {
      // Resets because this model gives better results when reset between
      // source changes.
      pose.reset();
    },
    onFrame:
        async (input, size) => {
          const aspect = size.height / size.width;
          let width, height;
          if (window.innerWidth > window.innerHeight) {
            height = window.innerHeight;
            width = height / aspect;
          } else {
            width = window.innerWidth;
            height = width * aspect;
          }
          canvasElement.width = width;
          canvasElement.height = height;
          await pose.send({image: input});
        },
  }),
])
.on(x => {
  videoElement.classList.toggle('selfie', x.cameraMode);
  pose.setOptions(optixons);
});
