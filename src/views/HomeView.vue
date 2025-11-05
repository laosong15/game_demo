<template>
  <div class="home-container">
    <div class="stars-background"></div>
    <div class="game-content">
      <div class="game-title">宇宙战机</div>
      <div class="buttons-container">
        <button class="start-button" id="start-game-button">开始游戏</button>
        <button class="rank-button" id="ranking-button">排行榜</button>
      </div>
      <div class="exit-tip">如果想退出游戏请直接关闭网页嗷~(੭ु´ ᐜ `)੭ु⁾⁾</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
// 按钮音效
const buttonSound = ref(null)
const clickSound = ref(null)

const startGame = () => {
  playClickSound()
  console.log('导航到战机选择页面')
  router.push('/select-plane')
}

const goToRanking = () => {
  playClickSound()
  console.log('导航到排行榜页面')
  router.push('/ranking')
}

// 播放按钮悬停音效
const playButtonSound = () => {
  if (!buttonSound.value) {
    // 创建音效对象
    buttonSound.value = new Audio('/music/Button.MP3')
    buttonSound.value.volume = 0.5 // 设置音量为50%
  }
  
  // 克隆音效以支持连续播放
  const soundClone = buttonSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放按钮悬停音效失败:', error)
  })
}

// 播放按钮点击音效
const playClickSound = () => {
  if (!clickSound.value) {
    // 创建音效对象
    clickSound.value = new Audio('/music/Click.mp3')
    clickSound.value.volume = 0.5 // 设置音量为50%
  }
  
  // 克隆音效以支持连续播放
  const soundClone = clickSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放按钮点击音效失败:', error)
  })
}

onMounted(() => {
  // 获取按钮元素
  const startButton = document.getElementById('start-game-button')
  const rankButton = document.getElementById('ranking-button')
  
  // 直接使用原生DOM事件监听器，确保可靠
  startButton.addEventListener('click', startGame)
  rankButton.addEventListener('click', goToRanking)
  
  // 添加鼠标悬停事件监听器播放音效
  startButton.addEventListener('mouseover', playButtonSound)
  rankButton.addEventListener('mouseover', playButtonSound)
  
  console.log('HomeView 已加载，按钮事件已绑定')
})

onUnmounted(() => {
  // 获取按钮元素
  const startButton = document.getElementById('start-game-button')
  const rankButton = document.getElementById('ranking-button')
  
  // 清理事件监听器
  if (startButton) {
    startButton.removeEventListener('click', startGame)
    startButton.removeEventListener('mouseover', playButtonSound)
  }
  if (rankButton) {
    rankButton.removeEventListener('click', goToRanking)
    rankButton.removeEventListener('mouseover', playButtonSound)
  }
  
  // 清理音效对象
  if (buttonSound.value) {
    buttonSound.value = null
  }
  if (clickSound.value) {
    clickSound.value = null
  }
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #000033 0%, #000066 50%, #000099 100%);
  position: relative;
  overflow: hidden;
}

.stars-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(white 1px, transparent 1px),
    radial-gradient(white 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  opacity: 0.1;
  animation: starsMove 60s linear infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes starsMove {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}

.game-title {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 3rem;
  text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #00ffff, 0 0 40px #00ffff;
  animation: titlePulse 2s infinite alternate;
}

@keyframes titlePulse {
  from { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #00ffff, 0 0 40px #00ffff; }
  to { text-shadow: 0 0 15px #fff, 0 0 30px #fff, 0 0 40px #00ffff, 0 0 50px #00ffff; }
}

.game-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  position: relative;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 20;
  position: relative;
}

.start-button,
.rank-button {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.5);
  position: relative;
  z-index: 10;
  overflow: visible;
  /* 确保按钮可点击 */
  pointer-events: auto;
}

.start-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.7);
  background: linear-gradient(45deg, #ff7675, #ff6348);
}

.rank-button {
  background: linear-gradient(45deg, #54a0ff, #0984e3);
  box-shadow: 0 5px 15px rgba(84, 160, 255, 0.5);
}

.rank-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(84, 160, 255, 0.7);
  background: linear-gradient(45deg, #74b9ff, #0984e3);
}

.exit-tip {
  margin-top: 3rem;
  font-size: 1rem;
  background: linear-gradient(45deg, #ff69b4, #9370db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 5px rgba(255, 105, 180, 0.8),
    0 0 10px rgba(255, 105, 180, 0.6),
    0 0 20px rgba(147, 112, 219, 0.6),
    0 0 30px rgba(147, 112, 219, 0.4);
  position: relative;
  z-index: 10;
  animation: tipFloat 3s ease-in-out infinite;
  font-weight: bold;
}

@keyframes tipFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>