/* --- アプリケーションの初期化 --- */
window.addEventListener('load', () => {

    // --- 1. 要素の取得 ---
    // このセクションでは、HTMLに書かれた各部品（ボタンなど）を
    // JavaScriptで操作できるように、変数に入れています。
    const canvas = document.getElementById('drawing-canvas');   /* 描画用のCanvas要素 */
    const ctx = canvas.getContext('2d');                        /* Canvasの2D描画コンテキスト */

    // 操作系ボタン
    const undoButton = document.getElementById('undo-button');  /* 元に戻すボタン */
    const redoButton = document.getElementById('redo-button');  /* やり直すボタン */
    const clearButton = document.getElementById('clear-button');/* キャンバスクリアボタン */
    const saveButton = document.getElementById('save-button');  /* 保存ボタン */

    // ツール選択ボタン
    const penTool = document.getElementById('pen-tool');        /* ペンツール */
    const eraserTool = document.getElementById('eraser-tool');  /* 消しゴムツール */
    const rectTool = document.getElementById('rect-tool');      /* 四角形ツール */
    const circleTool = document.getElementById('circle-tool');  /* 円ツール */
    const arrowTool = document.getElementById('arrow-tool');    /* 矢印ツール */
    const lineTool = document.getElementById('line-tool');      /* 線ツール */
    const textTool = document.getElementById('text-tool');      /* テキストツール */
    const toolButtons = [penTool, eraserTool, rectTool, circleTool, arrowTool, lineTool, textTool];

    // プロパティ（属性）設定
    const lineWidthSelect = document.getElementById('line-width-select');       /* 線の太さ選択 */
    const colorPickerButton = document.getElementById('color-picker-button');   /* カラーピッカー表示ボタン */
    const colorPicker = document.getElementById('color-picker');                /* 隠しカラーピッカー */
    const colorDisplay = document.querySelector('.color-display');              /* 現在色表示部分 */


    // --- 2. 状態を管理する変数 ---
    // アプリの「現在の状態」を記憶するための変数たちです。
    let isDrawing = false;          // 描画中かどうか
    let currentMode = 'pen';        // 現在のツールモード ('pen', 'eraser', 'rectangle', 'circle', 'arrow', 'line', 'text'など)
    let currentColor = '#000000'; // 現在の描画色
    let lineWidth = 5;              // 現在の線の太さ

    let startX = 0;                 // 図形を描き始めるX座標
    let startY = 0;                 // 図形を描き始めるY座標
    let snapshot;                   // 図形を描画する直前のCanvasの状態を保存する場所

    // Undo/Redo機能のための「歴史」を保存する配列
    const history_limit = 5;    /* 履歴の最大保存数 */
    let history = [];           /* 描画履歴配列 */
    let historyStep = -1;       /* 現在の履歴ステップ */


    // --- 3. 初期設定とリサイズ処理、canvasクリア時 ---

    /* Canvasの初期化関数 */
    function initializeCanvas() {
        const container = document.querySelector('.canvas-container');
        // 親要素のサイズから、padding分を引いてCanvasの解像度を設定します
        const cs = getComputedStyle(container);
        const padX = parseInt(cs.paddingLeft || 0) + parseInt(cs.paddingRight || 0);
        const padY = parseInt(cs.paddingTop || 0) + parseInt(cs.paddingBottom || 0);

        canvas.width = Math.max(100, container.clientWidth - padX);
        canvas.height = Math.max(100, container.clientHeight - padY);

        // 背景を白で塗りつぶす
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        history = [];
        historyStep = -1;
        saveHistory(); // 初期状態を歴史に保存
    }


    // --- 4. 描画のメインロジック ---

    /* 描画開始の関数 */
    function startDrawing(e) {

        if(currentMode==='text'){
            const txt = prompt('テキストを入力してください:');
            if(txt && txt.length > 0){
                ctx.fillStyle = currentColor;
                ctx.font = `${Math.max(12, lineWidth * 4)}px sans-serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(txt, e.offsetX,e.offsetY);
                saveHistory();
            }
            return;
        }
        isDrawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
    
        // ペン描画の開始位置を明示的に移動しておく
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // 図形ツールの場合、描き始める直前の画面を記憶しておく
        if (currentMode === 'rectangle' || currentMode === 'circle' || currentMode === 'arrow' || currentMode === 'line') {
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        
        ctx.beginPath(); // 新しいパスの開始
    }

    /* 描画中の関数 */
    function draw(e) {
        if (!isDrawing) return;

        // ペンか消しゴムモードの場合
        if (currentMode === 'pen' || currentMode === 'eraser') {
            ctx.strokeStyle = (currentMode === 'pen') ? currentColor : '#ffffff';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
        // 四角形モードの場合
        else if (currentMode === 'rectangle') {
            // 一度、描き始める前の状態に戻してから、新しいプレビューを描く
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
        }
        // 円モードの場合
        else if (currentMode === 'circle') {
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(e.offsetX - startX, 2) + Math.pow(e.offsetY - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        else if (currentMode === 'arrow' || currentMode === 'line') {
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();

            // スナップ処理：Shiftキーが押されている間、始点との差分を比較して
            // 近いほう（水平 or 垂直）に固定する
            let toX = e.offsetX;
            let toY = e.offsetY;
            if (e.shiftKey) {
                const dx = Math.abs(e.offsetX - startX);
                const dy = Math.abs(e.offsetY - startY);
                if (dx > dy) {
                    // 横方向の移動が大きい → 水平にスナップ（y固定）
                    toY = startY;
                } else {
                    // 縦方向の移動が大きいか同等 → 垂直にスナップ（x固定）
                    toX = startX;
                }
            }

            ctx.moveTo(startX, startY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            // 矢印モードなら矢尻も描画
            if (currentMode === 'arrow') {
                drawArrowHead(ctx, startX, startY, toX, toY, Math.max(10, lineWidth * 2));
            }
        }
    }

    /* 描画終了の関数 */
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        saveHistory(); // 描画が終わったら、その状態を歴史に保存
    }

    /* 画像保存の関数 */
    function doSave(){
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'lecture-note.png';
        link.click();
    }


    // --- 5. Undo/Redo機能 ---
    // 描画の歴史を管理し、「戻る」「進む」を実現します。

    /* 前のcanvasを保存する関数 */
    function saveHistory() {
        // 現在の歴史より先に進んでいる記録があれば、それを削除する
        history.length = historyStep + 1;
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

        if(history.length > history_limit){
            history.shift(); // 古い履歴を削除
        }
        historyStep = history.length - 1;

        updateUndoRedoButtons();
    }
    /* Undo機能 */
    function undo() {
        if (historyStep > 0) {
            historyStep--;
            ctx.putImageData(history[historyStep], 0, 0);
            updateUndoRedoButtons();
        }
    }
    /* Redo機能 */
    function redo() {
        if (historyStep < history.length - 1) {
            historyStep++;
            ctx.putImageData(history[historyStep], 0, 0);
            updateUndoRedoButtons();
        }
    }
    /* Undo/Redoボタンの有効/無効状態を更新 */
    function updateUndoRedoButtons(){
        undoButton.classList.toggle('disabled', historyStep <= 0);
        redoButton.classList.toggle('disabled', historyStep >= history.length - 1);
    }
    /* 矢印の矢尻を描く関数 */
    function drawArrowHead(ctx, fromX, fromY, toX, toY, headLen) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy,dx);
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    // --- 6. UIの更新とイベント設定 ---

    /* ツールボタンのアクティブ状態を更新 */
    function updateActiveTool(clickedTool) {
        toolButtons.forEach(button => button.classList.remove('active'));
        clickedTool.classList.add('active');
    }

    // 各ボタンに対応する機能を割り当てる
    penTool.addEventListener('click', () => { currentMode = 'pen'; updateActiveTool(penTool); });           /* ペンツールの設定*/
    eraserTool.addEventListener('click', () => { currentMode = 'eraser'; updateActiveTool(eraserTool); });  /* 消しゴムツールの設定*/
    rectTool.addEventListener('click', () => { currentMode = 'rectangle'; updateActiveTool(rectTool); });   /* 四角形ツールの設定*/
    circleTool.addEventListener('click', () => { currentMode = 'circle'; updateActiveTool(circleTool); });  /* 円ツールの設定*/
    arrowTool.addEventListener('click', () => { currentMode = 'arrow'; updateActiveTool(arrowTool); });     /* 矢印ツールの設定*/
    lineTool.addEventListener('click', () => { currentMode = 'line'; updateActiveTool(lineTool); });        /* 直線ツールの設定*/
    textTool.addEventListener('click', () => { currentMode = 'text'; updateActiveTool(textTool); });        /* テキストツールの設定*/
    /* クリアボタンの設定*/
    if(clearButton){
        clearButton.addEventListener('click', () => {
            const ok = confirm('キャンバスをすべてクリアしてもよろしいですか？\nこの操作は元に戻せません。');
            if(ok) initializeCanvas();
        });
    }
    
    undoButton.addEventListener('click', undo);/* 元に戻すボタンの設定*/
    redoButton.addEventListener('click', redo);/* やり直すボタンの設定*/

    lineWidthSelect.addEventListener('change', (e) => { lineWidth = e.target.value; });/* 線の太さ選択の設定*/
    
    /* カラーピッカーの設定*/
    colorPickerButton.addEventListener('click',()=>{
        colorPicker.click();/*隠しカラーピッカーをクリック*/
    });
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        colorDisplay.style.backgroundColor = currentColor; // ボタンの色表示も更新
    });

    canvas.addEventListener('mousedown', startDrawing); /* マウスダウンで描画開始*/
    canvas.addEventListener('mousemove', draw);         /* マウス移動で描画*/
    canvas.addEventListener('mouseup', stopDrawing);    /* マウスアップで描画終了*/
    canvas.addEventListener('mouseleave', stopDrawing); /* キャンバス外に出たら描画終了*/

    saveButton.addEventListener('click', doSave);       /* 保存ボタンの設定*/

    // --- 7. アプリケーションの実行開始 ---
    initializeCanvas();                                 /* キャンバスの初期化*/
    window.addEventListener('resize', initializeCanvas);/* ウィンドウリサイズ時にキャンバスを再初期化*/
    updateActiveTool(penTool);                          /* 初期ツールはペンに設定*/
    colorDisplay.style.backgroundColor = currentColor;  /* 初期色をボタンに表示*/

    /* --- 8. キーボードショートカットの追加 */

    window.addEventListener('keydown', (e) => {
        const meta = e.ctrlKey || e.metaKey;            /* CtrlキーまたはCmdキーの判定 */
        /* 画像保存のショートカット */
        if(meta && e.key.toLowerCase() === 's'){
            e.preventDefault();
            doSave();
            return;
        }
        /* Undoのショートカット */
        if(meta && e.key.toLowerCase() === 'z'){
            e.preventDefault();
            undo();
            return;
        }
        /* Redoのショートカット */
        if(meta && e.key.toLowerCase() === 'y'){
            e.preventDefault();
            redo();
            return;
        }
        /* クリアのショートカット */
        if(meta && e.shiftKey && e.key.toLowerCase() === 'k'){
            e.preventDefault();
            const ok = confirm('キャンバスをすべてクリアしてもよろしいですか？\nこの操作は元に戻せません。');
            if (ok) initializeCanvas();
            return;   
        }
    });
});
