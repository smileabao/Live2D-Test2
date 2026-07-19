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
    let lastMotionId = -1;
    const expressions = ['Happy', 'Warning', 'Cry', 'Blush', 'Dark', 'SlightBlush', 'Sad', 'HandPose'];
    const motions = [
      { group: 'Wave', index: 0 },
      { group: 'Wave', index: 1 },
      { group: 'Shake', index: 0 }
    ];

    const setRandomExpression = () => {
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      model.expression(randomExpr);
    };

    const playNextMotion = () => {
      if (!isHovering) return;
      // 隨機選擇一個動作，並確保不與上次重複
      let motionId = Math.floor(Math.random() * motions.length);
      if (motionId === lastMotionId) {
        motionId = (motionId + 1) % motions.length;
      }
      lastMotionId = motionId;
      
      const nextMotion = motions[motionId];
      model.motion(nextMotion.group, nextMotion.index);
    };

    // 取得所有控制按鈕
    const exprButtons = document.querySelectorAll('#expr-buttons .control-btn');
    const motionButtons = document.querySelectorAll('#motion-buttons .control-btn');

    const clearExprHighlights = () => {
      exprButtons.forEach(b => b.classList.remove('active'));
    };

    const clearMotionHighlights = () => {
      motionButtons.forEach(b => b.classList.remove('active'));
    };

    // 當滑鼠移入畫布時觸發表情與動作
    canvas.addEventListener('mouseenter', () => {
      isHovering = true;
      clearExprHighlights();
      clearMotionHighlights();
      
      // 預設將「正常」表情設為 active
      const normalBtn = document.querySelector('#expr-buttons .control-btn[data-expr="null"]');
      if (normalBtn) normalBtn.classList.add('active');

      setRandomExpression();
      playNextMotion();
    });

    // 當滑鼠移出畫布時恢復表情
    canvas.addEventListener('mouseleave', () => {
      isHovering = false;
      model.expression(null); // 恢復預設表情
      clearExprHighlights();
      clearMotionHighlights();
      
      // 預設將「正常」表情設為 active
      const normalBtn = document.querySelector('#expr-buttons .control-btn[data-expr="null"]');
      if (normalBtn) normalBtn.classList.add('active');
    });

    // 當一個動作播放完畢後，如果滑鼠仍在角色上，就繼續隨機播放下一個動作與切換表情
    model.internalModel.motionManager.on('motionFinish', () => {
      if (isHovering) {
        setRandomExpression();
        playNextMotion();
      }
    });

    // 綁定表情切換按鈕
    exprButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        isHovering = false; // 點擊按鈕切換為手動模式，停止滑鼠移入的隨機輪播
        clearExprHighlights();
        btn.classList.add('active');

        const exprName = btn.getAttribute('data-expr');
        if (exprName === 'null') {
          model.expression(null);
          status.textContent = '表情已重設為正常';
        } else {
          model.expression(exprName);
          status.textContent = `表情已切換為: ${exprName}`;
        }
      });
    });

    // 綁定動作切換按鈕
    motionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        isHovering = false; // 點擊按鈕切換為手動模式，停止滑鼠移入的隨機輪播
        clearMotionHighlights();
        btn.classList.add('active');

        const group = btn.getAttribute('data-group');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        model.motion(group, index);
        status.textContent = `動作已播放: ${group} (${index === 0 ? '第一個動作' : '第二個動作'})`;
      });
    });

    button.addEventListener('click', () => {
      isHovering = false;
      model.internalModel.motionManager.startRandomMotion('Wave');
      button.textContent = '再動一次';
      status.textContent = '播放隨機 Wave 動作';
    });
  } catch (error) {
    console.error('Live2D model load failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    status.textContent = `模型載入失敗：${detail}`;
    button.hidden = true;
  }
}
loadLive2D();
