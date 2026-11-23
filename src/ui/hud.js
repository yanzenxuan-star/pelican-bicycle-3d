/**
 * Riviera Experience HUD Controller & Vintage Postcard Snapshot Studio
 */
export function createHUD(callbacks) {
  const htmlEl = document.documentElement;
  const hudShell = document.getElementById('hud-shell');
  const hintLine = document.getElementById('hint-line');
  const tooltip = document.getElementById('scene-tooltip');

  const valSpeed = document.getElementById('val-speed');
  const valRpm = document.getElementById('val-rpm');
  const valDist = document.getElementById('val-dist');
  const valFish = document.getElementById('val-fish');

  const btnAudio = document.getElementById('btn-audio');
  const audioLabel = document.getElementById('audio-label');
  const btnTurbo = document.getElementById('btn-turbo');
  const btnBell = document.getElementById('btn-bell');
  const btnWings = document.getElementById('btn-wings');
  const btnFish = document.getElementById('btn-fish');
  const speedSlider = document.getElementById('speed-slider');

  const btnZen = document.getElementById('btn-zen');
  const btnZenExit = document.getElementById('btn-zen-exit');

  const btnStudio = document.getElementById('btn-studio');
  const studioDrawer = document.getElementById('studio-drawer');
  const btnStudioClose = document.getElementById('btn-studio-close');
  const btnRetake = document.getElementById('btn-retake');
  const btnDownload = document.getElementById('btn-download-postcard');
  const postcardCanvas = document.getElementById('postcard-canvas');

  const moodBtns = Array.from(document.querySelectorAll('.mood-btn'));
  const camBtns = Array.from(document.querySelectorAll('.cam-btn'));

  let zenMode = false;

  // Fade initial hint softly after visitor explores
  setTimeout(() => hintLine?.classList.add('is-faded'), 9500);

  // Mood switching
  moodBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mood;
      setMoodUI(m);
      callbacks.onMoodChange(m);
    });
  });

  function setMoodUI(moodKey, theme) {
    moodBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.mood === moodKey));
    if (theme) htmlEl.setAttribute('data-theme', theme);
  }

  // Camera presets
  camBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.cam;
      setCameraUI(c);
      callbacks.onCameraChange(c);
    });
  });

  function setCameraUI(camKey) {
    camBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.cam === camKey));
  }

  // Audio toggle
  btnAudio.addEventListener('click', async () => {
    const isOn = await callbacks.onToggleAudio();
    setAudioUI(isOn);
  });

  function setAudioUI(isOn) {
    btnAudio.setAttribute('aria-pressed', String(isOn));
    audioLabel.textContent = isOn ? '原声开启' : '开启原声';
  }

  // Action triggers
  btnTurbo.addEventListener('click', () => callbacks.onToggleTurbo());
  btnBell.addEventListener('click', () => callbacks.onBell());
  btnWings.addEventListener('click', () => callbacks.onToggleWings());
  btnFish.addEventListener('click', () => callbacks.onFeedFish());

  speedSlider.addEventListener('input', () => {
    callbacks.onSpeedSlider(Number(speedSlider.value) / 100);
  });

  // Zen mode
  function setZen(flag) {
    zenMode = flag;
    hudShell.classList.toggle('is-zen', zenMode);
    btnZenExit.hidden = !zenMode;
    if (zenMode) closeStudio();
  }
  btnZen.addEventListener('click', () => setZen(true));
  btnZenExit.addEventListener('click', () => setZen(false));

  // Vintage Postcard Snapshot Composer
  function renderPostcardSnapshot(webglCanvas, stats) {
    const ctx = postcardCanvas.getContext('2d');
    const W = postcardCanvas.width;
    const H = postcardCanvas.height;

    // Warm cream archival postcard paper border
    ctx.fillStyle = '#faf3e3';
    ctx.fillRect(0, 0, W, H);

    // Subtle paper deckle inner rule
    const pad = 28;
    const imgW = W - pad * 2;
    const imgH = H - pad * 2 - 74;

    // Cover-crop live WebGL canvas cleanly into postcard window
    const srcW = webglCanvas.width || 1280;
    const srcH = webglCanvas.height || 720;
    const srcAspect = srcW / srcH;
    const dstAspect = imgW / imgH;

    let sx = 0, sy = 0, sw = srcW, sh = srcH;
    if (srcAspect > dstAspect) {
      sw = srcH * dstAspect;
      sx = (srcW - sw) * 0.5;
    } else {
      sh = srcW / dstAspect;
      sy = (srcH - sh) * 0.5;
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, imgW, imgH, 8);
    ctx.clip();
    ctx.drawImage(webglCanvas, sx, sy, sw, sh, pad, pad, imgW, imgH);
    ctx.restore();

    ctx.strokeStyle = 'rgba(42, 34, 24, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, imgW, imgH);

    // Postcard caption strip along bottom margin
    const footerY = pad + imgH + 34;
    ctx.fillStyle = '#1e2428';
    ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
    ctx.fillText('GREETINGS FROM PELICAN COVE', pad, footerY);

    ctx.fillStyle = '#1b7d72';
    ctx.font = '700 15px "Noto Serif SC", serif';
    ctx.fillText(`蔚蓝海岸木栈道 · ${stats.moodLabel} · 已骑行 ${stats.distKm} km`, pad, footerY + 26);

    // Circular vintage coastal postmark stamp on bottom right
    const cx = W - pad - 42;
    const cy = footerY + 4;
    ctx.save();
    ctx.strokeStyle = '#d85b37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d85b37';
    ctx.font = '800 9px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RIVIERA', cx, cy - 3);
    ctx.fillText('PELI 3D', cx, cy + 9);
    ctx.restore();
  }

  function openStudio() {
    studioDrawer.classList.add('is-open');
    studioDrawer.setAttribute('aria-hidden', 'false');
    hudShell.classList.add('is-studio-open');
    callbacks.onRequestSnapshot(renderPostcardSnapshot);
  }

  function closeStudio() {
    studioDrawer.classList.remove('is-open');
    studioDrawer.setAttribute('aria-hidden', 'true');
    hudShell.classList.remove('is-studio-open');
  }

  btnStudio.addEventListener('click', () => {
    if (studioDrawer.classList.contains('is-open')) closeStudio();
    else openStudio();
  });
  btnStudioClose.addEventListener('click', closeStudio);
  btnRetake.addEventListener('click', () => callbacks.onRequestSnapshot(renderPostcardSnapshot));

  btnDownload.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `captain-peli-riviera-postcard-${Date.now()}.png`;
    a.href = postcardCanvas.toDataURL('image/png');
    a.click();
  });

  return {
    setMoodUI,
    setCameraUI,
    setAudioUI,
    setZen,
    isZen: () => zenMode,
    openStudio,
    closeStudio,
    setTurboUI(active) {
      btnTurbo.setAttribute('aria-pressed', String(active));
    },
    setWingsUI(active) {
      btnWings.setAttribute('aria-pressed', String(active));
    },
    updateTelemetry({ speedKmh, rpm, distKm, fishCount }) {
      valSpeed.textContent = speedKmh.toFixed(1);
      valRpm.textContent = String(Math.round(rpm));
      valDist.textContent = distKm.toFixed(2);
      valFish.textContent = String(fishCount);
    },
    setTooltip(text, x, y) {
      if (!text) {
        tooltip.classList.remove('is-visible');
        return;
      }
      tooltip.textContent = text;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.classList.add('is-visible');
    },
  };
}
