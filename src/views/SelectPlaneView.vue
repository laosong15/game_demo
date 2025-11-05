<template>
  <div class="select-plane-container">
    <div class="header">
      <h1>选择战机</h1>
      <button class="back-button" @click="goBack">返回</button>
    </div>
    
    <div class="planes-grid">
      <div 
        v-for="(plane, index) in planes" 
        :key="index"
        class="plane-item"
        :class="{ selected: selectedPlane === index }"
        @click="selectPlane(index)"
      >
        <div class="plane-preview">
          <div class="plane-sprite" :class="`plane-${index + 1}`"></div>
        </div>
        <div class="plane-info">
          <h3>{{ plane.name }}</h3>
          <div class="stats">
            <div class="stat">
              <span>速度:</span>
              <div class="stat-bar">
                <div class="stat-fill" :style="{ width: plane.speed * 10 + '%' }"></div>
              </div>
            </div>
            <div class="stat">
              <span>火力:</span>
              <div class="stat-bar">
                <div class="stat-fill fire" :style="{ width: plane.firepower * 10 + '%' }"></div>
              </div>
            </div>
            <div class="stat">
              <span>生命值:</span>
              <div class="stat-bar">
                <div class="stat-fill health" :style="{ width: plane.health * 10 + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <button class="confirm-button" @click="confirmSelection" :disabled="selectedPlane === null">
      确认选择
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedPlane = ref(null)
// 按钮音效
const buttonSound = ref(null)
const clickSound = ref(null)

const planes = [
  {
    name: '闪电战机',
    speed: 5,
    firepower: 3,
    health: 3
  },
  {   
    name: '幻影战机',   
    speed: 8,
    firepower: 5,
    health: 1.2 
   },
  {
    name: '重装战机',
    speed: 2,
    firepower: 4,
    health: 5
  },
  {
    name: '均衡战机',
    speed: 4,
    firepower: 4,
    health: 4
  }
]

const selectPlane = (index) => {
  playClickSound()
  selectedPlane.value = index
}

const confirmSelection = () => {
  if (selectedPlane.value !== null) {
    playClickSound()
    // 保存选择的战机信息到localStorage
    // 特殊处理幻影战机的索引，使其与GameView.vue中的索引一致
    let index = selectedPlane.value
    if (planes[selectedPlane.value].name === '幻影战机') {
      index = 7 // 对应GameView.vue中的.player-plane-7
    } else if (planes[selectedPlane.value].name === '闪电战机') {
      index = 4 // 对应GameView.vue中的.player-plane-4
    } else if (planes[selectedPlane.value].name === '重装战机') {
      index = 5 // 对应GameView.vue中的.player-plane-5
    } else if (planes[selectedPlane.value].name === '均衡战机') {
      index = 6 // 对应GameView.vue中的.player-plane-6
    }
    
    localStorage.setItem('selectedPlane', JSON.stringify({
      index: index,
      ...planes[selectedPlane.value]
    }))
    router.push('/game')
  }
}

const goBack = () => {
  playClickSound()
  router.push('/')
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
  // 检查是否已有选择的战机
  const saved = localStorage.getItem('selectedPlane')
  if (saved) {
    const planeData = JSON.parse(saved)
    selectedPlane.value = planeData.index
  }
  
  // 为所有按钮和战机选择项添加鼠标悬停音效
  setTimeout(() => {
    // 为按钮添加事件
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      button.addEventListener('mouseenter', playButtonSound)
    })
    
    // 为战机选择项添加事件
    const planeItems = document.querySelectorAll('.plane-item')
    planeItems.forEach(item => {
      item.addEventListener('mouseenter', playButtonSound)
    })
  }, 100)
})

onUnmounted(() => {
  // 清理按钮悬停音效事件监听器
  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    button.removeEventListener('mouseenter', playButtonSound)
  })
  
  // 清理战机选择项的事件监听器
  const planeItems = document.querySelectorAll('.plane-item')
  planeItems.forEach(item => {
    item.removeEventListener('mouseenter', playButtonSound)
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
.select-plane-container {
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

.select-plane-container::before {
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

.header h1 {
  font-size: 2.5rem;
  text-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
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

.planes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  flex: 1;
  z-index: 1;
}

.plane-item {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  backdrop-filter: blur(10px);
}

.plane-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
}

.plane-item.selected {
  background: rgba(0, 255, 255, 0.2);
  border-color: #00ffff;
  box-shadow: 0 0 20px #00ffff;
}

.plane-item.selected::after {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  color: #00ffff;
}

.plane-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.plane-sprite {
  width: 120px;
  height: 120px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

/* 闪电战机 - 对应游戏中的player-plane-4 */
.plane-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='30' y='20' width='40' height='50' rx='5' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Cpath d='M30 20 L50 0 L70 20' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Cpath d='M40 70 L50 90 L60 70' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Ccircle cx='45' cy='50' r='4' fill='%23ff00ff'/%3E%3Ccircle cx='55' cy='50' r='4' fill='%23ff00ff'/%3E%3Cpath d='M20 40 L30 30 M80 40 L70 30' stroke='%23ffff00' stroke-width='3' stroke-dasharray='5,3'/%3E%3C/svg%3E");
}

/* 幻影战机 - 对应游戏中的player-plane-7 */
.plane-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L85 40 L80 50 L20 50 L15 40 Z' fill='%23660066' stroke='%23ff00ff' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%23660066' stroke='%23ff00ff' stroke-width='2'/%3E%3Ccircle cx='45' cy='40' r='3' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Ccircle cx='55' cy='40' r='3' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Cpath d='M10 35 L20 25 M90 35 L80 25' stroke='%23ff00ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Cpath d='M25 65 L30 75 M75 65 L70 75' stroke='%23ff00ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%23ff00ff' stroke='%23660066' stroke-width='1'/%3E%3C/svg%3E");
}

/* 重装战机 - 对应游戏中的player-plane-5 */
.plane-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='30' width='50' height='40' rx='5' fill='%23990000' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 40 L25 30 M85 40 L75 30' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 50 L25 50 M85 50 L75 50' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 60 L25 60 M85 60 L75 60' stroke='%23ff6600' stroke-width='3'/%3E%3Ccircle cx='40' cy='45' r='5' fill='%23ffcc00' stroke='%23ffff00' stroke-width='1'/%3E%3Ccircle cx='60' cy='45' r='5' fill='%23ffcc00' stroke='%23ffff00' stroke-width='1'/%3E%3Crect x='35' y='65' width='30' height='10' rx='2' fill='%23663300' stroke='%23996600' stroke-width='2'/%3E%3Cpath d='M45 75 L50 90 L55 75' fill='%23663300' stroke='%23996600' stroke-width='2'/%3E%3C/svg%3E");
}

/* 均衡战机 - 对应游戏中的player-plane-6 */
.plane-4 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L90 40 L80 50 L20 50 L10 40 Z' fill='%230066cc' stroke='%2300ccff' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%230066cc' stroke='%2300ccff' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Ccircle cx='60' cy='40' r='4' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Cpath d='M20 30 L30 20 M80 30 L70 20' stroke='%2300ccff' stroke-width='2'/%3E%3Cpath d='M25 60 L30 70 M75 60 L70 70' stroke='%2300ccff' stroke-width='2'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%2300ccff' stroke='%230066cc' stroke-width='1'/%3E%3C/svg%3E");
}

.plane-info h3 {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat span {
  width: 50px;
  font-size: 0.9rem;
}

.stat-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #0984e3);
  transition: width 0.3s ease;
}

.stat-fill.fire {
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
}

.stat-fill.health {
  background: linear-gradient(90deg, #00b894, #00cec9);
}

.confirm-button {
  margin-top: 2rem;
  padding: 1rem 3rem;
  font-size: 1.25rem;
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

.confirm-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 210, 211, 0.7);
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>