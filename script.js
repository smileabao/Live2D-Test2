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

    // 對話視窗文字庫
    const dialogues = {
      default: [
        "嗨！移過來和我互動看看吧！",
        "點擊左側的按鈕可以測試我的表情和動作喔！"
      ],
      Happy: [
        "嘿嘿，今天也是美好的一天！(〃∀〃)",
        "看到你來，我真的好開心呀！"
      ],
      Warning: [
        "警告！不要一直點我啦！(>_<)",
        "嗚... 戳太用力了，警告你喔！"
      ],
      Cry: [
        "嗚嗚... 怎麼了？QAQ",
        "抱抱... 不要難過嘛..."
      ],
      Blush: [
        "唔... 你在看我嗎？(*ﾉ▽ﾉ)",
        "哎呀，突然覺得好害羞..."
      ],
      Dark: [
        "……（盯著你）",
        "發生了什麼事嗎？怎麼世界變黑了..."
      ],
      SlightBlush: [
        "嘿嘿... 這樣被你看著有點不好意思...",
        "心跳好像有點快呢..."
      ],
      Sad: [
        "心情有點低落... 陪我聊聊好嗎？",
        "唉，今天稍微有點提不起勁..."
      ],
      HandPose: [
        "給你比個讚！你今天做得很好！d(`･∀･`)",
        "看我的招手！耶～"
      ],
      Shake: [
        "不對不對，不是那樣的～",
        "搖頭晃腦中... 嘿嘿！"
      ]
    };
    
    let isHovering = false;
    let lastMotionId = -1;
    let bubbleTimeout = null;
    const expressions = ['Happy', 'Warning', 'Cry', 'Blush', 'Dark', 'SlightBlush', 'Sad', 'HandPose'];
    const motions = [
      { group: 'Wave', index: 0 },
      { group: 'Wave', index: 1 },
      { group: 'Shake', index: 0 }
    ];

    const showDialogue = (key) => {
      const list = dialogues[key] || dialogues.default;
      const text = list[Math.floor(Math.random() * list.length)];
      const bubble = document.querySelector('#live2d-bubble');
      const bubbleText = document.querySelector('#bubble-text');
      
      if (bubble && bubbleText) {
        // 先移除 show 來完成淡出與重設位置
        bubble.classList.remove('show');
        
        // 稍微延遲後換字並淡入
        setTimeout(() => {
          bubbleText.textContent = text;
          bubble.classList.add('show');
        }, 150);

        if (bubbleTimeout) {
          clearTimeout(bubbleTimeout);
        }
      }
    };

    const hideBubbleAfterDelay = (delay) => {
      if (bubbleTimeout) {
        clearTimeout(bubbleTimeout);
      }
      bubbleTimeout = setTimeout(() => {
        if (!isHovering) {
          const bubble = document.querySelector('#live2d-bubble');
          if (bubble) {
            bubble.classList.remove('show');
          }
        }
      }, delay);
    };

    const setRandomExpression = () => {
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      model.expression(randomExpr);
      showDialogue(randomExpr); // 切換對話框文字
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
      
      // 如果隨機到搖頭，切換為搖頭的專屬台詞
      if (nextMotion.group === 'Shake') {
        showDialogue('Shake');
      }
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

      // 滑鼠離開後，3秒後隱藏對話框
      hideBubbleAfterDelay(3000);
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
          showDialogue('default');
          hideBubbleAfterDelay(3000);
        } else {
          model.expression(exprName);
          status.textContent = `表情已切換為: ${exprName}`;
          showDialogue(exprName);
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
        
        if (group === 'Shake') {
          showDialogue('Shake');
        } else {
          showDialogue('HandPose');
        }
      });
    });

    button.addEventListener('click', () => {
      isHovering = false;
      model.internalModel.motionManager.startRandomMotion('Wave');
      button.textContent = '再動一次';
      status.textContent = '播放隨機 Wave 動作';
      showDialogue('HandPose');
    });

    // 模型初次加載完成，顯示問候語，並於6秒後自動隱藏
    showDialogue('default');
    hideBubbleAfterDelay(6000);
  } catch (error) {
    console.error('Live2D model load failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    status.textContent = `模型載入失敗：${detail}`;
    button.hidden = true;
  }
}
loadLive2D();
