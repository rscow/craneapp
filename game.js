const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

context.imageSmoothingEnabled = false;

function rect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawBackground() {
  rect(0, 0, 960, 540, "#79bce5");

  context.fillStyle = "#f7dfa0";
  context.fillRect(760, 64, 56, 56);

  context.fillStyle = "#d5a55d";
  context.fillRect(0, 450, 960, 90);
  context.fillStyle = "#9e7d4f";
  context.fillRect(0, 450, 960, 8);

  for (let x = 0; x < 960; x += 48) {
    rect(x, 458, 24, 82, x % 96 === 0 ? "#b58a55" : "#c29b61");
  }
}

function drawBuilding() {
  rect(650, 318, 250, 132, "#b2b0a1");

  for (let floor = 318; floor < 450; floor += 44) {
    rect(650, floor, 250, 8, "#7d7e77");

    for (let column = 666; column < 900; column += 72) {
      rect(column, floor + 10, 48, 26, "#31557d");
      rect(column + 8, floor + 16, 32, 14, "#78a8bd");
    }
  }

  rect(650, 306, 250, 12, "#ddbd70");
  rect(638, 294, 274, 12, "#8a6a44");
}

function drawStagingArea() {
  rect(48, 438, 230, 12, "#5f4b38");
  rect(48, 450, 230, 8, "#3c342d");

  rect(72, 394, 58, 44, "#d85d42");
  rect(84, 382, 34, 12, "#9e3e32");
  rect(176, 406, 58, 32, "#8a69c7");
  rect(188, 394, 34, 12, "#604394");
}

function drawTargets() {
  rect(700, 270, 58, 24, "#f4df84");
  rect(710, 278, 38, 8, "#fff1ad");

  rect(812, 270, 58, 24, "#f4df84");
  rect(822, 278, 38, 8, "#fff1ad");

  rect(820, 362, 58, 24, "#f4df84");
  rect(830, 370, 38, 8, "#fff1ad");
}

function drawCrane() {
  rect(430, 132, 70, 318, "#e6e0b8");
  rect(422, 124, 86, 12, "#81755a");
  rect(446, 144, 38, 12, "#b14d3f");

  rect(40, 124, 640, 18, "#f3c64f");
  rect(40, 142, 640, 8, "#9a6f30");

  rect(430, 116, 70, 8, "#f3c64f");
  rect(452, 92, 26, 24, "#d85d42");

  rect(300, 142, 92, 20, "#c94f43");
  rect(316, 162, 60, 12, "#7d3b34");

  rect(346, 174, 8, 116, "#27384a");
  rect(338, 286, 24, 12, "#ffd56a");

  rect(0, 450, 430, 90, "#4d5e62");
  rect(0, 450, 430, 8, "#263840");
}

function drawLabels() {
  context.fillStyle = "#26384a";
  context.font = "bold 16px 'Courier New', monospace";
  context.fillText("STAGING", 116, 424);
  context.fillText("BUILDING", 744, 442);
}

function drawScene() {
  drawBackground();
  drawBuilding();
  drawStagingArea();
  drawTargets();
  drawCrane();
  drawLabels();
}

drawScene();
