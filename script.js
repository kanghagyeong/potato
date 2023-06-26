const video = document.getElementById("video");

// 얼굴 표정 관련 모델 데이터 로드
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
]).then(startVideo);

// 모델 데이터 로드 완료 시 유저에게 비디오 권한 받아옴
function startVideo() {
  navigator.getUserMedia(
    { video: { width: 1920, height: 1080 } },
    (stream) => {
      video.srcObject = stream;
      sendMsgToChild("permission");
    },
    (err) => console.error(err)
  );
}

// 실시간으로 웹캠 인식 후 표정 데이터 받아옴
video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    // faceapi.draw.drawDetections(canvas, resizedDetections);
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    sendMsgToChild(resizedDetections);
  }, 100);
});

// 게임 iframe창으로 메시지 전달
function sendMsgToChild(msg) {
  document.querySelector("iframe").contentWindow.postMessage(msg, "*");
}

// 게임 iframe창으로 부터 메시지 수신
function receiveMsgFromChild(e) {
  if (e.data.stage) {
    if (e.data.stage > 0) {
      document.querySelector("img").src = `./image/${e.data.stage}.png`;
      document.getElementById("video").style.display = "block";
      document.getElementById("imgContainer").style.display = "flex";
    } else {
      document.getElementById("video").style.display = "none";
      document.getElementById("imgContainer").style.display = "none";
    }
  } else if (e.data.capture) {
    capture(e.data.capture.stage);
  }
}

function capture(stage) {
  var canvas = document.getElementById("canvas");
  const canvasSize = {
    width: 240,
    height: 160,
  };
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  canvas
    .getContext("2d")
    .drawImage(video, 0, 0, canvasSize.width, canvasSize.height);
  const dataURL = canvas.toDataURL();
  sendMsgToChild({
    type: "capture",
    stage: stage,
    url: dataURL,
  });
}

window.addEventListener("message", receiveMsgFromChild);
