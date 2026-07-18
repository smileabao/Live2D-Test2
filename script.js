const status = document.querySelector('#model-status');
const button = document.querySelector('#toggle-motion');
const canvas = document.querySelector('#live2d-canvas');

async function loadLive2D() {
  try {
    const app = new PIXI.Application({ view: canvas, autoStart: true, resizeTo: canvas.parentElement, transparent: true, antialias: true });
    const model = await PIXI.live2d.Live2DModel.from('model.model3.json', { autoInteract: true });
    app.stage.addChild(model);
    const baseWidth = model.width;
    const baseHeight = model.height;
    const fit = () => {
      const scale = Math.min(app.renderer.width / baseWidth * 0.82, app.renderer.height / baseHeight * 0.88);
      model.scale.set(scale);
      model.x = (app.renderer.width - baseWidth * scale) / 2;
      model.y = app.renderer.height - baseHeight * scale;
    };
    fit();
    window.addEventListener('resize', fit);
    status.textContent = '模型已就緒・試著移動滑鼠';
    button.addEventListener('click', () => {
      model.internalModel.motionManager.startRandomMotion('Idle');
      button.textContent = '再動一次';
    });
  } catch (error) {
    console.error('Live2D model load failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    status.textContent = `模型載入失敗：${detail}`;
    button.hidden = true;
  }
}
loadLive2D();
