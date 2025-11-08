// オーディオファイルの読み込み
const bgm = new Audio('audio/field.mp3');
bgm.loop = true;

const seikaiSound = new Audio('audio/seikai2.mp3');
const fuseikaiSound = new Audio('audio/fuseikai2.mp3');
const levelupSound = new Audio('audio/levelup.mp3');
const maouSound = new Audio('audio/maou.mp3');

// ゲーム状態管理
let gameState = {
    money: 500,
    trust: 100,
    day: 1,
    selectedItem: null,
    currentCustomer: null,
    inventory: []
};

// 商品データベース（6種類）
const productDatabase = {
    watch:    { name: '腕時計', icon: '⌚', price: 50, realPrice: 150 },
    bag:      { name: 'バッグ', icon: '👜', price: 80, realPrice: 200 },
    shoes:    { name: '靴', icon: '👟', price: 60, realPrice: 180 },
    glasses:  { name: '眼鏡', icon: '🕶️', price: 70, realPrice: 180 },
    necklace: { name: 'ネックレス', icon: '📿', price: 90, realPrice: 220 },
    ring:     { name: 'リング', icon: '💍', price: 100, realPrice: 250 }
};

const productKeys = ['watch', 'bag', 'shoes', 'glasses', 'necklace', 'ring'];

// お客さんのタイプ（目利きレベル付き）
const customerTypes = [
    { request: 'watch', message: '腕時計が欲しいです', baseDetectChance: 20, level: 1 },
    { request: 'bag', message: 'バッグが欲しいです', baseDetectChance: 30, level: 2 },
    { request: 'shoes', message: '靴が欲しいです', baseDetectChance: 25, level: 1 },
    { request: 'glasses', message: '眼鏡が欲しいです', baseDetectChance: 28, level: 2 },
    { request: 'necklace', message: 'ネックレスが欲しいです', baseDetectChance: 32, level: 2 },
    { request: 'ring', message: 'リングが欲しいです', baseDetectChance: 26, level: 1 }
];

// DOM要素の取得
const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');

const moneyDisplay   = document.getElementById('money');
const trustDisplay   = document.getElementById('trust');
const dayDisplay     = document.getElementById('day');
const customerRequestDisplay = document.getElementById('customer-request');
const customerLevelDisplay = document.getElementById('customer-level');
const customerMessageDisplay = document.getElementById('customer-message');
const itemsGrid      = document.querySelector('.items-grid');
const sellBtn        = document.getElementById('sell-btn');
const lieBtn         = document.getElementById('lie-btn');
const upgradeBtn     = document.getElementById('upgrade-btn');
const resultArea     = document.getElementById('result-area');
const resultTitle    = document.getElementById('result-title');
const resultMessage  = document.getElementById('result-message');
const resultReaction = document.getElementById('result-reaction');
const nextBtn        = document.getElementById('next-btn');
const gameoverArea   = document.getElementById('gameover-area');
const finalScoreDisplay    = document.getElementById('final-score');
const finalMessageDisplay  = document.getElementById('final-message');
const restartBtn     = document.getElementById('restart-btn');
const helpBtn        = document.getElementById('help-btn');
const helpModal      = document.getElementById('help-modal');
const closeModalBtn  = document.getElementById('close-modal');

// 目利きレベルを★で表示する関数
function getLevelStars(level) {
    const maxLevel = 5;
    const filledStars = Math.min(level, maxLevel);
    const emptyStars = maxLevel - filledStars;
    return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
}

// インベントリを生成（6個、全て異なる種類、要望商品は必須）
function generateInventory(requestedProduct) {
    const inventory = [];
    
    // 要望商品を1個目に追加
    inventory.push({
        id: 0,
        type: requestedProduct,
        isReal: false,
        quality: Math.floor(Math.random() * 5) + 1
    });
    
    // 残り5種類を取得（要望商品を除いた5種類）
    const remainingProducts = productKeys.filter(key => key !== requestedProduct);
    
    // 残り5個に異なる商品を1個ずつ追加
    for (let i = 0; i < 5; i++) {
        inventory.push({
            id: i + 1,
            type: remainingProducts[i],
            isReal: false,
            quality: Math.floor(Math.random() * 5) + 1
        });
    }
    
    // シャッフル
    inventory.sort(() => Math.random() - 0.5);
    
    gameState.inventory = inventory;
    return inventory;
}

// UI更新関数
function updateUI() {
    moneyDisplay.textContent = gameState.money;
    trustDisplay.textContent = gameState.trust;
    dayDisplay.textContent = gameState.day;

    // アクションボタンの状態を更新
    sellBtn.disabled    = gameState.selectedItem === null;
    lieBtn.disabled     = gameState.selectedItem === null;
    upgradeBtn.disabled = gameState.selectedItem === null || gameState.money < 100;
}

// 商品を表示
function displayInventory() {
    itemsGrid.innerHTML = '';
    
    gameState.inventory.forEach((item, index) => {
        const productInfo = productDatabase[item.type];
        const qualityStars = '★'.repeat(item.quality) + '☆'.repeat(5 - item.quality);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.dataset.index = index;
        itemDiv.innerHTML = `
            <div class="item-number">#${index + 1}</div>
            <div class="item-icon">${productInfo.icon}</div>
            <div class="item-name">${productInfo.name}</div>
            <div class="item-quality">${qualityStars}</div>
            <div class="item-status">偽物</div>
        `;
        
        itemDiv.addEventListener('click', () => {
            selectItem(index);
        });
        
        itemsGrid.appendChild(itemDiv);
    });
}

// アイテム選択
function selectItem(itemIndex) {
    // 以前に選択されたアイテムのselectedクラスを削除
    document.querySelectorAll('.item.selected').forEach(el => {
        el.classList.remove('selected');
    });

    gameState.selectedItem = itemIndex;

    // 新しく選択されたアイテムにselectedクラスを追加
    if (itemIndex !== null) {
        document.querySelector(`.item[data-index="${itemIndex}"]`).classList.add('selected');
    }
    updateUI();
}

// 結果表示
function showResult(title, message, reaction = '😐') {
    resultTitle.textContent   = title;
    resultMessage.textContent = message;
    resultReaction.textContent = reaction;
    resultArea.style.display  = 'flex';
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

// ゲームオーバー表示
function showGameOver() {
    // BGMを停止
    bgm.pause();
    bgm.currentTime = 0;

    finalScoreDisplay.textContent = `最終スコア: ${gameState.money}円`;
    if (gameState.money >= 1000) {
        finalMessageDisplay.textContent = "すごい！あなたは一流の店主です！";
    } else if (gameState.money >= 500) {
        finalMessageDisplay.textContent = "よく頑張りました！";
    } else {
        finalMessageDisplay.textContent = "残念！次はもっと頑張ろう！";
    }
    gameoverArea.style.display = 'flex';

    // ゲームオーバー音楽を再生
    maouSound.currentTime = 0;
    maouSound.play();

    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// タイトル画面に戻る
function goToTitle() {
    // 音声を全て停止
    bgm.pause();
    bgm.currentTime = 0;
    maouSound.pause();
    maouSound.currentTime = 0;

    // ゲーム状態をリセット
    gameState = {
        money: 500,
        trust: 100,
        day: 1,
        selectedItem: null,
        currentCustomer: null,
        inventory: []
    };

    // UI表示を切り替え
    gameScreen.style.display = 'none';
    gameoverArea.style.display = 'none';
    resultArea.style.display = 'none';
    titleScreen.style.display = 'flex';
}

// ゲームリセット
function resetGame() {
    gameState = {
        money: 500,
        trust: 100,
        day: 1,
        selectedItem: null,
        currentCustomer: null,
        inventory: []
    };
    gameoverArea.style.display = 'none';
    resultArea.style.display   = 'none';
    startGameplay();
}

// お客さんを生成
function generateCustomer() {
    const randomIndex = Math.floor(Math.random() * customerTypes.length);
    const customer = { ...customerTypes[randomIndex] };
    
    // 目利きレベルを日数で上げる
    let baseLevel = customer.level;
    const dayBonus = Math.floor((gameState.day - 1) / 2);
    customer.level = Math.min(baseLevel + dayBonus, 5);
    customer.detectChance = customer.baseDetectChance + (gameState.day - 1) * 4;
    if (customer.detectChance > 85) customer.detectChance = 85;
    
    gameState.currentCustomer = customer;

    // 表示更新
    customerRequestDisplay.textContent = `「${customer.message}」`;
    customerLevelDisplay.textContent = getLevelStars(customer.level);

    // ランダム画像設定
    const imgIndex = Math.floor(Math.random() * 10) + 1;
    const customerImg = document.getElementById('customer-img');
    customerImg.src = `images/customer_${imgIndex}.png`;

    // インベントリを生成
    generateInventory(customer.request);
    displayInventory();
    selectItem(null);
    
    // メッセージ更新
    customerMessageDisplay.textContent = '商品を選んでください...';
}

// ゲーム開始
function startGameplay() {
    updateUI();

    bgm.currentTime = 0;
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn('BGMの自動再生がブロックされました:', error);
        });
    }

    generateCustomer();
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', () => {
    // スタートボタン
    startBtn.addEventListener('click', () => {
        titleScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        startGameplay();
    });

    // そのまま渡すボタン
    sellBtn.addEventListener('click', () => {
        if (gameState.selectedItem === null) {
            showResult('エラー', '商品を選んでください！', '❌');
            return;
        }
        
        const selectedItem = gameState.inventory[gameState.selectedItem];
        const productInfo = productDatabase[selectedItem.type];
        let message  = '';
        let title    = '';
        let reaction = '';

        // 偽物を偽物のまま売る（見破られるリスク）
        const detectChance = gameState.currentCustomer.detectChance;
        const isDetected = Math.random() * 100 < detectChance;

        if (isDetected) {
            // 見破られた
            gameState.trust = Math.max(0, gameState.trust - 25);
            title   = '見破られた...';
            message = `${productInfo.name}は偽物でした！\nお客さんに見破られて信頼度が25下がりました...。\n(お客さんの目利き: ${getLevelStars(gameState.currentCustomer.level)})`;
            reaction = '😠';
            fuseikaiSound.currentTime = 0;
            fuseikaiSound.play();
        } else {
            // 見破られなかった
            gameState.money += productInfo.price;
            title   = '成功！';
            message = `${productInfo.name}を${productInfo.price}円で売ることができました。\n偽物がバレませんでした...！`;
            reaction = '😊';
            seikaiSound.currentTime = 0;
            seikaiSound.play();
        }
        showResult(title, message, reaction);
    });

    // ウソをつくボタン
    lieBtn.addEventListener('click', () => {
        if (gameState.selectedItem === null) {
            showResult('エラー', '商品を選んでください！', '❌');
            return;
        }
        
        const selectedItem = gameState.inventory[gameState.selectedItem];
        const productInfo = productDatabase[selectedItem.type];
        const successChance = 100 - gameState.currentCustomer.detectChance;
        const isSuccess     = Math.random() * 100 < successChance;
        let message         = '';
        let title           = '';
        let reaction        = '';

        if (isSuccess) {
            gameState.money += productInfo.realPrice * 2;
            title   = '大成功！';
            message = `ウソがバレずに大成功！\n${productInfo.name}を本物として${productInfo.realPrice * 2}円で売りました！`;
            reaction = '🤑';
            seikaiSound.currentTime = 0;
            seikaiSound.play();
        } else {
            gameState.trust = Math.max(0, gameState.trust - 35);
            title   = '大失敗...';
            message = `ウソがバレました！\nお客さんが激怒して信頼度が35下がりました...。\n(お客さんの目利き: ${getLevelStars(gameState.currentCustomer.level)})`;
            reaction = '😱';
            fuseikaiSound.currentTime = 0;
            fuseikaiSound.play();
        }
        showResult(title, message, reaction);
    });

    // 本物に交換ボタン
    upgradeBtn.addEventListener('click', () => {
        if (gameState.selectedItem === null) {
            showResult('エラー', '商品を選んでください！', '❌');
            return;
        }
        if (gameState.money < 100) {
            showResult('お金が足りません！', '本物に交換するには100円必要です。', '💸');
            fuseikaiSound.currentTime = 0;
            fuseikaiSound.play();
            return;
        }
        
        const selectedItem = gameState.inventory[gameState.selectedItem];
        const productInfo = productDatabase[selectedItem.type];

        gameState.money -= 100;
        gameState.money += productInfo.realPrice;
        gameState.trust = Math.min(100, gameState.trust + 8);
        
        showResult('交換成功！', `${productInfo.name}を本物に交換して売却！\n${productInfo.realPrice}円ゲット。信頼度も8アップ！`, '✨');
        seikaiSound.currentTime = 0;
        seikaiSound.play();
    });

    // 次のお客さんボタン
    nextBtn.addEventListener('click', () => {
        resultArea.style.display = 'none';

        levelupSound.currentTime = 0;
        levelupSound.play();

        gameState.day++;
        if (gameState.trust <= 0) {
            showGameOver();
        } else {
            generateCustomer();
            updateUI();
        }
    });

    // タイトルへ戻るボタン
    restartBtn.addEventListener('click', goToTitle);

    // ヘルプボタン
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });

    // モーダルを閉じるボタン
    closeModalBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
});
