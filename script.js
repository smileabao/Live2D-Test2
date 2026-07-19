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
      // 放大並由畫布裁切腰部以下，只保留右下角的角色上半身。
      const scale = Math.max(app.renderer.width / baseWidth * 1.08, app.renderer.height / baseHeight * 1.92);
      model.scale.set(scale);
      model.x = (app.renderer.width - baseWidth * scale) / 2;
      model.y = 0;
    };
    fit();
    window.addEventListener('resize', fit);
    status.textContent = '模型已就緒・試著將滑鼠移到角色上';
    
    let isHovering = false;
    let lastMotionIndex = -1;
    const expressions = ['Happy', 'Warning'];

    const setRandomExpression = () => {
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      model.expression(randomExpr);
    };

    const playNextMotion = () => {
      if (!isHovering) return;
      // 隨機選擇 Wave 群組中的一個動作（0 或 1），並確保不與上次重複
      let index = Math.floor(Math.random() * 2);
      if (index === lastMotionIndex) {
        index = (index + 1) % 2;
      }
      lastMotionIndex = index;
      model.motion('Wave', index);
    };

    // 當滑鼠移入畫布時觸發表情與動作
    canvas.addEventListener('mouseenter', () => {
      isHovering = true;
      setRandomExpression();
      playNextMotion();
    });

    // 當滑鼠移出畫布時恢復表情
    canvas.addEventListener('mouseleave', () => {
      isHovering = false;
      model.expression(null); // 恢復預設表情
    });

    // 當一個動作播放完畢後，如果滑鼠仍在角色上，就繼續隨機播放下一個動作與切換表情
    model.internalModel.motionManager.on('motionFinish', () => {
      if (isHovering) {
        setRandomExpression();
        playNextMotion();
      }
    });

    button.addEventListener('click', () => {
      model.internalModel.motionManager.startRandomMotion('Wave');
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
