<template>
  <div class="ranking-container">
    <div class="header">
      <h1>排行榜</h1>
      <div class="header-buttons">
        <button class="clear-button" @click="clearRankings" :disabled="rankings.length === 0">清除排行</button>
        <button class="back-button" @click="goBack">返回</button>
      </div>
    </div>
    
    <div class="ranking-list">
      <div v-if="rankings.length === 0" class="empty-ranking">
        <p>还没有留下记录嗷~，去挑战自己吧！⁽⁽٩(๑˃̶͈̀ ᗨ ˂̶͈́)۶⁾⁾</p>
        <button @click="goToGame">去挑战</button>
      </div>
      
      <div v-else class="rankings">
        <div 
          v-for="(ranking, index) in rankings" 
          :key="index"
          class="ranking-item"
          :class="{ 'top-three': index < 3 }"
        >
          <div class="rank-number">
            <template v-if="index === 0">🥇</template>
            <template v-else-if="index === 1">🥈</template>
            <template v-else-if="index === 2">🥉</template>
            <template v-else>{{ index + 1 }}</template>
          </div>
          <div class="rank-score">{{ ranking.score }}</div>
          <div class="rank-date">{{ ranking.date }}</div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const rankings = ref([])
// 按钮悬停音效
const buttonSound = ref(null)
const clickSound = ref(null)

const loadRankings = () => {
  const saved = localStorage.getItem('gameRankings')
  if (saved) {
    rankings.value = JSON.parse(saved)
  }
}

const goBack = () => {
  playClickSound()
  router.push('/')
}

const clearRankings = () => {
  playClickSound()
  if (confirm('确定要清除所有排行榜记录吗？此操作不可恢复。')) {
    localStorage.removeItem('gameRankings')
    rankings.value = []
  }
}

const goToGame = () => {
  playClickSound()
  router.push('/select-plane')
}

// 播放按钮悬停音效
const playButtonSound = () => {
  if (!buttonSound.value) {
    buttonSound.value = new Audio('/music/Button.MP3')
    buttonSound.value.volume = 0.5 // 设置音量为50%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = buttonSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放按钮悬停音效失败:', error)
  })
}

// 播放按钮点击音效
const playClickSound = () => {
  if (!clickSound.value) {
    clickSound.value = new Audio('/music/Click.mp3')
    clickSound.value.volume = 0.5 // 设置音量为50%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = clickSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放按钮点击音效失败:', error)
  })
}

onMounted(() => {
  loadRankings()
  
  // 为所有按钮添加鼠标悬停音效
  setTimeout(() => {
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      button.addEventListener('mouseover', playButtonSound)
    })
  }, 100)
})

onUnmounted(() => {
  // 清理按钮悬停音效事件监听器
  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    button.removeEventListener('mouseover', playButtonSound)
  })
  
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
.ranking-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #000033 0%, #000066 50%, #000099 100%);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.ranking-container::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image: 
    radial-gradient(white 1px, transparent 1px),
    radial-gradient(white 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  opacity: 0.1;
  animation: starsMove 60s linear infinite;
  z-index: 0;
}

@keyframes starsMove {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  z-index: 1;
}

.header-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header h1 {
  font-size: 2.5rem;
  text-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
}

.clear-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.5);
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background: linear-gradient(45deg, #54a0ff, #0984e3);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(84, 160, 255, 0.5);
}

.ranking-list {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  z-index: 1;
  margin-bottom: 2rem;
}

.empty-ranking {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 2rem;
}

.empty-ranking p {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.empty-ranking button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  color: white;
  background: linear-gradient(45deg, #00ffff, #0984e3);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.5);
}

.empty-ranking button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 255, 255, 0.7);
}

.rankings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.ranking-item.top-three {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.05));
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
}

.rank-number {
  width: 50px;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

.ranking-item.top-three .rank-number {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.rank-score {
  flex: 1;
  font-size: 1.8rem;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.ranking-item.top-three .rank-score {
  color: #ffd700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

.rank-date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
  min-width: 150px;
}

.play-button {
  margin-top: auto;
  padding: 1.25rem 3rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, #00d2d3, #00cec9);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 210, 211, 0.5);
  z-index: 1;
}

.play-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 210, 211, 0.7);
  background: linear-gradient(45deg, #00e6e6, #00d9d9);
}

/* 滚动条样式 */
.ranking-list::-webkit-scrollbar {
  width: 8px;
}

.ranking-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.ranking-list::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.5);
  border-radius: 4px;
}

.ranking-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.7);
}
</style>