export default function calcularPosicoesDivergencia(
  diverge,
  currentBounds,
  participantBounds,
  participants,
  laneHeight,
  lane
) {
  const positions = [];
  const baseX = currentBounds.x + 150;
  const baseY = participantBounds.y + participants.indexOf(lane) * laneHeight + laneHeight / 2 - 18;

  for (let i = 0; i < diverge; i++) {
    const yOffset = (i - (diverge - 1) / 2) * (laneHeight / diverge);
    let position;

    if (diverge === "1") {
      // Apenas meio
      position = {
        x: baseX,
        y: baseY,
        width: 35,
        height: 35,
        yOffset: yOffset,
      };
    } else if (diverge === "2") {
      // Apenas cima e baixo
      const isTop = i === 0;
      const yAdjust = isTop ? -17.5 : +17.5;

      position = {
        x: baseX - 17.5,
        y: baseY + yAdjust,
        width: 35,
        height: 35,
        yOffset: yOffset,
      };
    } else if (diverge === "3") {
      // Cima, meio e baixo
      if (i === 0) {
        // Cima
        position = {
          x: baseX - 17.5,
          y: baseY - 17.5,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      } else if (i === 1) {
        // Meio
        position = {
          x: baseX,
          y: baseY,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      } else if (i === 2) {
        // Baixo
        position = {
          x: baseX - 17.5,
          y: baseY + 17.5,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      }
    } else {
      // diverge > 3
      if (i === 0) {
        // Cima
        position = {
          x: baseX - 17.5,
          y: baseY - 17.5,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      } else if (i === diverge - 1) {
        // Baixo
        position = {
          x: baseX - 17.5,
          y: baseY + 17.5,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      } else {
        // Meio
        position = {
          x: baseX,
          y: baseY,
          width: 35,
          height: 35,
          yOffset: yOffset,
        };
      }
    }

    positions.push(position);
  }

  return positions;
}
