const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const radiusReadout = document.getElementById("radius-readout");
const hookReadout = document.getElementById("hook-readout");
const sideReadout = document.getElementById("side-readout");
const loadStatus = document.getElementById("load-status");
const capacityReadout = document.getElementById("capacity-readout");
const capacityWarning = document.getElementById("capacity-warning");

context.imageSmoothingEnabled = false;

const crane = {
  radiusOffset: 100,
  hookHeight: 50,
};

let loads = [
  { id: "green", weight: 18000, homeX: 404, homeY: 558, x: 404, y: 558, width: 72, height: 72, color: "#65a85a" },
  { id: "blue", weight: 14000, homeX: 404, homeY: 486, x: 404, y: 486, width: 72, height: 72, color: "#4d82c7" },
  { id: "yellow", weight: 12000, homeX: 342, homeY: 558, x: 342, y: 558, width: 72, height: 72, color: "#e6c84d" },
  { id: "red", weight: 8000, homeX: 270, homeY: 558, x: 270, y: 558, width: 72, height: 72, color: "#d85d42" },
  { id: "purple", weight: 5000, homeX: 198, homeY: 606, x: 198, y: 606, width: 72, height: 24, color: "#8a69c7" },
];

const loadChart = [
  { radius: 50, capacity: 20000 },
  { radius: 75, capacity: 13000 },
  { radius: 100, capacity: 9000 },
  { radius: 125, capacity: 7000 },
  { radius: 150, capacity: 5500 },
];

let targets = [
  { id: "target-near-low", x: 740, y: 502, width: 72, height: 28, delivered: false },
  { id: "target-mid-low", x: 850, y: 502, width: 72, height: 28, delivered: false },
  { id: "target-far-low", x: 994, y: 502, width: 72, height: 28, delivered: false },
  { id: "target-near-high", x: 740, y: 402, width: 72, height: 28, delivered: false },
  { id: "target-mid-high", x: 922, y: 402, width: 72, height: 28, delivered: false },
  { id: "target-far-high", x: 1002, y: 402, width: 72, height: 28, delivered: false },
];

let attachedLoad = null;
let gameOver = false;
let tipStartedAt = 0;
let roundNumber = 1;
let roundTransition = false;
let roundTransitionTimeout = null;
let buildingHeight = 372;
let craneArmY = 88;

const keys = new Set();
const minRadius = 50;
const maxRadius = 150;
const minHookHeight = 0;
const maxHookHeight = 100;
let previousTime = performance.now();

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
  }
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    if (gameOver) {
      resetGame();
      return;
    }
    handleLoadAction();
  }
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

window.addEventListener("blur", () => {
  keys.clear();
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function interpolateCapacity(radius) {
  const boundedRadius = clamp(radius, 50, 150);

  for (let index = 0; index < loadChart.length - 1; index += 1) {
    const lower = loadChart[index];
    const upper = loadChart[index + 1];

    if (boundedRadius >= lower.radius && boundedRadius <= upper.radius) {
      const ratio = (boundedRadius - lower.radius) / (upper.radius - lower.radius);
      return lower.capacity + (upper.capacity - lower.capacity) * ratio;
    }
  }

  return boundedRadius === 50
    ? loadChart[0].capacity
    : loadChart[loadChart.length - 1].capacity;
}

function getCurrentRadius() {
  return Math.round(Math.abs(crane.radiusOffset));
}

function getSafetyStatus() {
  if (!attachedLoad) return null;

  const radius = getCurrentRadius();
  const capacity = interpolateCapacity(radius);
  const ratio = attachedLoad.weight / capacity;

  if (ratio > 1) {
    return { type: "tip", radius, capacity, ratio };
  }
  if (ratio >= 0.9) {
    return { type: "warning", radius, capacity, ratio };
  }
  return { type: "safe", radius, capacity, ratio };
}

function resetGame() {
  crane.radiusOffset = 100;
  crane.hookHeight = 50;
  attachedLoad = null;
  gameOver = false;
  tipStartedAt = 0;
  roundTransition = false;
  if (roundTransitionTimeout !== null) {
    window.clearTimeout(roundTransitionTimeout);
    roundTransitionTimeout = null;
  }
  roundNumber = 1;
  buildingHeight = 372;
  craneArmY = 88;
  capacityWarning.hidden = true;

  generateRound();
  loadStatus.textContent = "READY";
}

function triggerTipOver() {
  if (gameOver) return;
  gameOver = true;
  keys.clear();
  tipStartedAt = performance.now();
  loadStatus.textContent = "OVERLOAD - GAME OVER";
}

function rect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), width, height);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function generateRound() {
  const loadTemplates = [
    { id: "green", weight: 18000, width: 72, height: 72, color: "#65a85a" },
    { id: "blue", weight: 14000, width: 72, height: 72, color: "#4d82c7" },
    { id: "yellow", weight: 12000, width: 72, height: 72, color: "#e6c84d" },
    { id: "red", weight: 8000, width: 72, height: 72, color: "#d85d42" },
    { id: "purple", weight: 5000, width: 72, height: 24, color: "#8a69c7" },
  ];

  const count = 3 + Math.floor(Math.random() * 3);
  const selected = shuffled(loadTemplates).slice(0, count);

  const stagingBands = {
    green: [50, 55],
    blue: [55, 65],
    yellow: [70, 75],
    red: [90, 100],
    purple: [100, 145],
  };

  loads = selected.map((template, index) => {
    const stagingBand = stagingBands[template.id];
    const stagingRadius = stagingBand[0]
      + Math.random() * (stagingBand[1] - stagingBand[0]);
    const boundedRadius = clamp(stagingRadius, minRadius, maxRadius);
    const homeCenterX = 600 - boundedRadius * 3.2;
    const homeX = clamp(homeCenterX - template.width / 2, 150, 582);
    const stagger = index % 3 === 0 ? 18 : index % 3 === 1 ? 0 : -18;
    return {
      ...template,
      homeX,
      homeY: template.id === "purple" ? 606 + stagger : 558 + stagger,
      x: homeX,
      y: template.id === "purple" ? 606 + stagger : 558 + stagger,
      delivered: false,
    };
  });

  loads.forEach((load) => {
    const stagingCenterX = load.homeX + load.width / 2;
    const stagingRadius = Math.abs(stagingCenterX - 600) / 3.2;
    if (interpolateCapacity(stagingRadius) < load.weight) {
      const safeRadius = load.weight <= 5000 ? 145
        : load.weight <= 8000 ? 100
        : load.weight <= 12000 ? 75
        : load.weight <= 14000 ? 65
        : 55;
      load.homeX = clamp(
        600 - safeRadius * 3.2 - load.width / 2,
        150,
        520,
      );
      load.x = load.homeX;
    }
  });

  const heightOptions = [
    { building: 288, crane: 222 },
    { building: 360, crane: 150 },
    { building: 432, crane: 88 },
  ];
  const heightChoice = randomItem(heightOptions);
  buildingHeight = heightChoice.building;
  craneArmY = heightChoice.crane;
  crane.hookHeight = 50;

  const buildingTop = 630 - buildingHeight;
  const targetCenters = [760, 780, 820, 840, 900, 960, 1020, 1080];
  const validTargetCenters = targetCenters.filter((center) =>
    Math.abs(center - 600) / 3.2 >= 50 &&
    Math.abs(center - 600) / 3.2 <= 150
  );
  const availableRows = [502, 430, 358, 286].filter((y) => y >= buildingTop);
  const usedPositions = [];

  const targetAssignmentOrder = [...selected].sort((first, second) => second.weight - first.weight);

  targets = [];

  targetAssignmentOrder.forEach((template, index) => {
    const candidates = [];

    validTargetCenters.forEach((center) => {
      const radius = Math.abs(center - 600) / 3.2;
      if (interpolateCapacity(radius) < template.weight) return;

      availableRows.forEach((y) => {
        const candidateRect = {
          x: center - 36,
          y,
          width: 72,
          height: 28,
        };
        const overlaps = usedPositions.some((used) => {
          const separateHorizontally =
            candidateRect.x + candidateRect.width + 20 <= used.x ||
            used.x + used.width + 20 <= candidateRect.x;
          const separateVertically =
            candidateRect.y + candidateRect.height + 16 <= used.y ||
            used.y + used.height + 16 <= candidateRect.y;
          return !(separateHorizontally || separateVertically);
        });

        if (!overlaps) candidates.push(candidateRect);
      });
    });

    if (candidates.length === 0) return;

    const candidate = randomItem(
      template.weight >= 14000
        ? [...candidates].sort((first, second) => first.x - second.x)
        : [...candidates].sort((first, second) => second.x - first.x),
    );

    usedPositions.push(candidate);
    targets.push({
      id: `target-${template.id}-${index}`,
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height,
      loadId: template.id,
      delivered: false,
    });
  });

  attachedLoad = null;
  capacityWarning.hidden = true;
  loadStatus.textContent = `ROUND ${roundNumber} - READY`;
  const roundReadout = document.getElementById("round-readout");
  if (roundReadout) roundReadout.textContent = String(roundNumber);
}

function getCraneGeometry() {
  const mastX = 600;
  const armY = craneArmY;
  const direction = crane.radiusOffset < 0 ? -1 : 1;
  const radiusDistance = direction * clamp(
    Math.abs(crane.radiusOffset),
    minRadius,
    maxRadius,
  );
  const trolleyX = mastX + radiusDistance * 3.2;
  const cableLength = 630 - craneArmY - (630 - craneArmY) * (crane.hookHeight / 100);

  return {
    mastX,
    armY,
    trolleyX,
    hookX: trolleyX,
    hookY: armY + cableLength,
  };
}

function intersectsLoad(load, hookX, hookY) {
  const pickupRect = {
    x: load.x + 16,
    y: load.y - 16,
    width: 40,
    height: 16,
  };

  return (
    hookX >= pickupRect.x &&
    hookX <= pickupRect.x + pickupRect.width &&
    hookY >= pickupRect.y &&
    hookY <= pickupRect.y + pickupRect.height
  );
}

function isInSuccessfulDropMargin(candidate) {
  if (!attachedLoad || candidate.delivered) return false;

  const { hookX, hookY } = getCraneGeometry();
  const attachedLoadBottom = hookY + 16 + attachedLoad.height;
  const horizontalMargin = 18;
  const verticalMargin = 12;
  const horizontalOverlap =
    hookX + attachedLoad.width / 2 + horizontalMargin >= candidate.x &&
    hookX - attachedLoad.width / 2 - horizontalMargin <= candidate.x + candidate.width;
  const alignedWithTop =
    Math.abs(attachedLoadBottom - candidate.y) <= verticalMargin;

  return (
    horizontalOverlap &&
    alignedWithTop
  );
}

function handleLoadAction() {
  const { hookX, hookY } = getCraneGeometry();
  if (gameOver) return;

  if (attachedLoad) {
    const attachedLoadBottom = hookY + 16 + attachedLoad.height;
    const horizontalMargin = 18;
    const verticalMargin = 12;
    const target = targets.find((candidate) => {
      const horizontalOverlap =
        hookX + attachedLoad.width / 2 + horizontalMargin >= candidate.x &&
        hookX - attachedLoad.width / 2 - horizontalMargin <= candidate.x + candidate.width;
      const alignedWithTop =
        Math.abs(attachedLoadBottom - candidate.y) <= verticalMargin;

      return (
        !candidate.delivered &&
        horizontalOverlap &&
        alignedWithTop
      );
    });

    if (target) {
      target.delivered = true;
      attachedLoad.delivered = true;
      attachedLoad = null;
      loadStatus.textContent = "DELIVERY SUCCESS";
      if (loads.every((load) => load.delivered) && !roundTransition) {
        roundTransition = true;
        loadStatus.textContent = "ROUND COMPLETE";
        roundTransitionTimeout = window.setTimeout(() => {
          roundNumber += 1;
          roundTransition = false;
          roundTransitionTimeout = null;
          generateRound();
        }, 900);
      }
    } else {
      attachedLoad.x = attachedLoad.homeX;
      attachedLoad.y = attachedLoad.homeY;
      attachedLoad = null;
      loadStatus.textContent = "INCORRECT DROP";
    }
    return;
  }

  const load = loads.find((candidate) =>
    !candidate.delivered &&
    intersectsLoad(candidate, hookX, hookY)
  );

  if (load) {
    attachedLoad = load;
    const safety = getSafetyStatus();

    if (safety?.type === "tip") {
      triggerTipOver();
    } else if (safety?.type === "warning") {
      loadStatus.textContent = `WARNING - ${load.weight.toLocaleString()} LB AT 90%+`;
    } else {
      loadStatus.textContent = `LOAD ATTACHED - ${load.weight.toLocaleString()} LB`;
    }
  } else {
    loadStatus.textContent = "NO LOAD UNDER HOOK";
  }
}

function drawBackground() {
  rect(0, 0, 1200, 720, "#79bce5");

  context.fillStyle = "#f7dfa0";
  context.fillRect(1040, 58, 72, 72);

  context.fillStyle = "#d5a55d";
  rect(0, 630, 1200, 90, "#d5a55d");
  context.fillStyle = "#9e7d4f";
  rect(0, 630, 1200, 8, "#9e7d4f");

  for (let x = 0; x < 1200; x += 48) {
    rect(x, 638, 24, 82, x % 96 === 0 ? "#b58a55" : "#c29b61");
  }
}

function drawBuilding() {
  const buildingTop = 630 - buildingHeight;
  rect(680, buildingTop, 460, buildingHeight, "#b2b0a1");

  for (let floor = buildingTop; floor < 630; floor += 72) {
    rect(680, floor, 460, 10, "#7d7e77");

    for (let column = 698; column < 1124; column += 92) {
      rect(column, floor + 14, 58, 30, "#31557d");
      rect(column + 10, floor + 20, 38, 18, "#78a8bd");
    }
  }

  rect(680, buildingTop - 14, 460, 14, "#ddbd70");
  rect(668, buildingTop - 30, 484, 16, "#8a6a44");
}

function drawStagingArea() {
  rect(150, 618, 432, 12, "#5f4b38");
  rect(150, 630, 432, 8, "#3c342d");
}

function drawTargets() {
  targets.forEach((target) => {
    const isReady = isInSuccessfulDropMargin(target);
    const targetColor = target.delivered ? "#65a85a" : isReady ? "#65d66d" : "#f4df84";
    const insetColor = target.delivered ? "#8ccc78" : isReady ? "#a6efa9" : "#fff1ad";

    rect(target.x, target.y, target.width, target.height, targetColor);
    rect(target.x + 12, target.y + 10, target.width - 24, 10, insetColor);
  });
}

function drawLoads() {
  loads.forEach((load) => {
    if (load.delivered || load === attachedLoad) return;
    rect(load.x, load.y, load.width, load.height, load.color);

    const topColors = {
      red: "#9e3e32",
      purple: "#604394",
      yellow: "#9f862d",
      blue: "#315b92",
      green: "#4b803f",
    };
    rect(load.x + 16, load.y - 16, 40, 16, topColors[load.id]);
  });

  if (attachedLoad) {
    const { hookX, hookY } = getCraneGeometry();
    rect(hookX - attachedLoad.width / 2, hookY + 16, attachedLoad.width, attachedLoad.height, attachedLoad.color);
  }
}

function drawCrane() {
  const { mastX, armY, trolleyX, hookX, hookY } = getCraneGeometry();
  const trolleyY = armY;
  const armStartX = clamp(
    Math.min(mastX, trolleyX),
    mastX - maxRadius * 3.2,
    mastX,
  );
  const armEndX = clamp(
    Math.max(mastX, trolleyX),
    mastX,
    mastX + maxRadius * 3.2,
  );
  const armWidth = armEndX - armStartX;

  const tiltDirection = crane.radiusOffset < 0 ? -1 : 1;
  const tilt = gameOver ? Math.min(22, (performance.now() - tipStartedAt) / 18) : 0;
  context.save();
  context.translate(600, 630);
  context.rotate((tilt * tiltDirection * Math.PI) / 180);
  context.translate(-600, -630);

  rect(588, craneArmY - 12, 24, 630 - craneArmY + 12, "#e6e0b8");
  rect(570, armY, 60, 14, "#81755a");
  rect(594, 146, 12, 14, "#b14d3f");

  rect(armStartX, armY - 9, armWidth, 18, "#f3c64f");
  rect(armStartX, armY + 9, armWidth, 8, "#9a6f30");

  rect(trolleyX - 46, trolleyY - 10, 92, 20, "#c94f43");
  rect(trolleyX - 30, trolleyY + 10, 60, 12, "#7d3b34");
  rect(hookX - 4, trolleyY + 22, 8, Math.max(0, hookY - (trolleyY + 22)), "#27384a");
  rect(hookX - 12, hookY - 12, 24, 12, "#ffd56a");

  rect(0, 630, 600, 90, "#4d5e62");
  rect(0, 630, 430, 8, "#263840");
  context.restore();
}

function drawLabels() {
  context.fillStyle = "#26384a";
  context.font = "bold 16px 'Courier New', monospace";
  context.fillText("STAGING", 340, 604);
  context.fillText("BUILDING", 878, 650);
}

function drawScene() {
  drawBackground();
  drawBuilding();
  drawStagingArea();
  drawTargets();
  drawLoads();
  drawCrane();
  drawLabels();
}

function drawCapacityWarning() {
  if (!attachedLoad) return;

  const safety = getSafetyStatus();
  if (safety.type !== "warning") return;

  context.fillStyle = "#d85d42";
  context.fillRect(430, 24, 340, 44);
  context.strokeStyle = "#fff4c7";
  context.lineWidth = 4;
  context.strokeRect(430, 24, 340, 44);
  context.fillStyle = "#fff4c7";
  context.font = "bold 22px 'Courier New', monospace";
  context.textAlign = "center";
  context.fillText("90% CAPACITY WARNING", 600, 53);
  context.textAlign = "left";
}

function drawTipOver() {
  if (!gameOver) return;

  context.fillStyle = "rgba(92, 16, 16, 0.72)";
  context.fillRect(0, 0, 1200, 720);
  context.fillStyle = "#fff4c7";
  context.font = "bold 64px 'Courier New', monospace";
  context.textAlign = "center";
  context.fillText("CRANE TIP", 600, 320);
  context.font = "bold 32px 'Courier New', monospace";
  context.fillText("GAME OVER", 600, 370);
  context.textAlign = "left";
}

function update(deltaSeconds) {
  if (gameOver) return;

  const previousRadiusOffset = crane.radiusOffset;

  if (keys.has("ArrowLeft")) {
    crane.radiusOffset -= 25 * deltaSeconds;
  }
  if (keys.has("ArrowRight")) {
    crane.radiusOffset += 25 * deltaSeconds;
  }
  if (keys.has("ArrowUp")) {
    crane.hookHeight -= 35 * deltaSeconds;
  }
  if (keys.has("ArrowDown")) {
    crane.hookHeight += 35 * deltaSeconds;
  }

  if (
    crane.radiusOffset > -minRadius &&
    crane.radiusOffset < minRadius &&
    previousRadiusOffset !== 0
  ) {
    crane.radiusOffset =
      previousRadiusOffset > 0
        ? -minRadius
        : minRadius;
  }
  crane.radiusOffset = clamp(crane.radiusOffset, -maxRadius, maxRadius);
  crane.hookHeight = clamp(crane.hookHeight, minHookHeight, maxHookHeight);

  const radius = getCurrentRadius();
  const capacity = interpolateCapacity(radius);
  radiusReadout.textContent = `${radius} ft`;
  hookReadout.textContent = `${Math.round(crane.hookHeight)}%`;
  sideReadout.textContent = crane.radiusOffset < 0 ? "LEFT" : "RIGHT";
  capacityReadout.textContent = `${Math.round(capacity).toLocaleString()} lb`;

  if (attachedLoad) {
    const safety = getSafetyStatus();
    if (safety.type === "tip") {
      capacityWarning.hidden = true;
      triggerTipOver();
    } else if (safety.type === "warning") {
      const warningPercent = Math.floor(safety.ratio * 100);
      capacityWarning.hidden = false;
      loadStatus.textContent =
        `WARNING - ${attachedLoad.weight.toLocaleString()} LB / ${Math.round(safety.capacity).toLocaleString()} LB (${warningPercent}%)`;
    } else if (!loadStatus.textContent.startsWith("DELIVERY")) {
      capacityWarning.hidden = true;
      loadStatus.textContent = `LOAD ATTACHED - ${attachedLoad.weight.toLocaleString()} LB`;
    }
  } else {
    capacityWarning.hidden = true;
  }
}

function frame(currentTime) {
  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  update(deltaSeconds);
  drawScene();
  drawCapacityWarning();
  drawTipOver();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
