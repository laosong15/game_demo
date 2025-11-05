<template>
  <div class="game-container" ref="gameContainer" :style="starRandomStyles">
    <!-- 银河效果层 -->
    <div class="galaxy-effect"></div>
    <!-- 星云效果层 -->
    <div class="nebula-effect"></div>
    <div v-if="!gameStarted && !isPlayerEntering" class="game-start-overlay">
      <div class="start-info">
        <h2>准备开始!</h2>
        <p>使用方向键或WASD控制战机移动</p>
        <p>战机将自动发射子弹</p>
        <p>按空格键释放技能</p>
        <p>按ESC键或点击暂停按钮暂停游戏</p>
        <button @click="startGameLoop">点击开始</button>
      </div>
    </div>
    
    <div v-if="gameOver" class="game-over-overlay">
      <div class="game-over-info">
        <h2>游戏结束</h2>
        <p>最终得分: {{ score }}</p>
        <button @click="restartGame">重新开始</button>
        <button @click="selectPlaneAgainDirect">重选战机</button>
        <button @click="goToRanking">查看排行榜</button>
      </div>
    </div>
    
    <div class="game-hud">
      <div class="hud-left">
        <button v-if="gameStarted && !gameOver" class="pause-button" @click="pauseGame">
          暂停
        </button>
        <div class="score">得分: {{ score }}</div>
      </div>
      <div class="health" v-if="selectedPlane?.name !== '幻影战机'">
        生命: 
        <div class="health-bar">
          <div class="health-fill" :style="{ width: playerHealthPercent + '%' }"></div>
        </div>
      </div>
      <!-- 幻影战机的单独生命条 -->
      <div v-if="selectedPlane?.name === '幻影战机'">
        <div class="phantom-health-container">
          <div class="health health-1">
            战机1生命: 
            <div class="health-bar">
              <div class="health-fill" :style="{ width: playerHealthPercent + '%' }"></div>
            </div>
          </div>
          <div class="health health-2">
        战机2生命: 
        <div class="health-bar">
          <div class="health-fill" :style="{ width: player2HealthPercent + '%' }"></div>
        </div>
      </div>
        </div>
      </div>

      <div class="skill-active" v-if="skillActive">
        火力全开: {{ Math.ceil((skillEndTime - Date.now()) / 1000) }}s
      </div>
      <div class="skill-active" v-else-if="isStealth">
        隐形涂装: {{ Math.ceil((stealthEndTime - Date.now()) / 1000) }}s
      </div>
      <div class="skill-cooldown" v-else-if="skillCooldown > 0">
        技能冷却: {{ Math.ceil(skillCooldown / 1000) }}s
      </div>
      <div class="skill-ready" v-else-if="skillCooldown === 0 && !skillActive && !isStealth">
        <template v-if="selectedPlane?.name === '闪电战机'">冲击波就绪</template>
        <template v-else-if="selectedPlane?.name === '幻影战机'">隐形涂装就绪</template>
        <template v-else-if="selectedPlane?.name === '重装战机'">装甲修复就绪</template>
        <template v-else-if="selectedPlane?.name === '均衡战机'">火力全开就绪</template>
      </div>
    </div>
    
    <div class="game-area" ref="gameArea">
      <!-- 玩家战机 -->
      <div 
        v-if="playerHealth > 0"
        class="player-plane" 
        :class="[
          `player-plane-${selectedPlane?.index || 0}`, 
          { 
            invulnerable: player.isInvulnerable,
            'skill-active': skillActive && selectedPlane?.name === '均衡战机'
          }
        ]"
        :style="{ left: player.x + 'px', top: player.y + 'px' }"
      ></div>
      
      <!-- 第二架战机（仅幻影战机时显示） -->
      <div 
        v-if="player2.active" 
        class="player-plane" 
        :class="[
          selectedPlane?.name === '幻影战机' ? 'player-plane-7 player-plane-7-secondary' : `player-plane-${selectedPlane?.index || 0}`, 
          { 
            invulnerable: player2.isInvulnerable,
            'skill-active': skillActive && selectedPlane?.name === '均衡战机'
          }
        ]"
        :style="{ left: player2.x + 'px', top: player2.y + 'px' }"
      ></div>
      

      
      <!-- 玩家子弹 -->
      <div 
        v-for="(bullet, index) in playerBullets" 
        :key="'bullet-' + index"
        class="bullet player-bullet"
        :class="{ 'gold-bullet': bullet.isGold }"
        :style="{ left: bullet.x + 'px', top: bullet.y + 'px' }"
      ></div>
      
      <!-- 敌机 -->
      <div 
        v-for="(enemy, index) in enemies" 
        :key="'enemy-' + index"
        class="enemy-plane"
        :class="[
          `enemy-${enemy.type}`, 
          {
            'shield-active': enemy.hasShield,
            'medical-support-active': enemy.showHealingEffect
          }
        ]"
        :style="{ 
          left: enemy.x + 'px', 
          top: enemy.y + 'px',
          transform: enemy.type === 7 ? 'translate(-50%, -50%) translate(' + enemy.width/2 + 'px, ' + enemy.height/2 + 'px)' : 'none'
        }"
      ></div>
      <!-- 魔王号正五边形辉光效果 -->
      <div
        v-for="(enemy, index) in enemies.filter(e => e.type === 7)"
        :key="'pentagon-glow-' + index"
        class="pentagon-glow-effect"
        :style="{
          left: enemy.x + 'px',
          top: enemy.y + 'px',
          width: enemy.width + 'px',
          height: enemy.height + 'px',
          transform: 'translate(-50%, -50%) translate(' + enemy.width/2 + 'px, ' + enemy.height/2 + 'px)'
        }"
      ></div>
      
      <!-- 魔女号金色正六边形辉光效果 -->
      <div
        v-for="(enemy, index) in enemies.filter(e => e.type === 8)"
        :key="'hexagon-glow-' + index"
        class="hexagon-glow-effect"
        :style="{
          left: enemy.x + 'px',
          top: enemy.y + 'px',
          width: enemy.width + 'px',
          height: enemy.height + 'px'
        }"
      ></div>
      
      <!-- 敌机子弹 -->
      <div 
        v-for="(bullet, index) in enemyBullets" 
        :key="'enemy-bullet-' + index"
        class="bullet enemy-bullet"
        :class="{ 'shield-bullet': bullet.isShieldBullet, 'vanguard-bullet': bullet.isVanguardBullet, 'devil-bullet': bullet.isDevilBullet, 'witch-bullet': bullet.isWitchBullet, 'scatter-shot-bullet': bullet.isScatterShotBullet }"
        :style="{ left: bullet.x + 'px', top: bullet.y + 'px' }"
      ></div>
      
      <!-- 爆炸效果 -->
      <div 
        v-for="(explosion, index) in explosions" 
        :key="'explosion-' + index"
        class="explosion"
        :class="explosion.isLaser ? 'explosion-laser' :
                explosion.balance ? `explosion-balance-${explosion.frame}` :
                explosion.stealth ? `explosion-stealth-${explosion.frame}` : 
                explosion.armor ? `explosion-armor-${explosion.frame}` : 
                `explosion-${explosion.frame}`"
        :style="{ 
          left: explosion.x + 'px', 
          top: explosion.y + 'px',
          width: explosion.isLaser ? explosion.width + 'px' : '',
          height: explosion.isLaser ? explosion.height + 'px' : ''
        }"
      ></div>
      
      <!-- 激光警告线 -->
      <template 
        v-for="(enemy, enemyIndex) in enemies.filter(e => e.specialAbility === 'deathLaser' && e.isLaserWarning && e.laserPositions)"
        :key="'enemy-laser-' + enemyIndex"
      >
        <div 
          v-for="(laserX, posIndex) in enemy.laserPositions" 
          :key="'laser-warning-' + enemyIndex + '-' + posIndex"
          class="laser-warning"
          :style="{ 
            left: laserX + 'px', 
            width: enemy.laserWidth + 'px', 
            height: gameHeight + 'px' 
          }"
        ></div>
      </template>
    </div>
    
    <!-- 暂停弹窗 -->
    <div v-if="isPaused" class="game-pause-overlay">
      <div class="pause-info">
        <h2>游戏暂停</h2>
        <button @click="resumeGame" class="pause-btn continue-btn">继续</button>
        <button @click="restartGame" class="pause-btn restart-btn">重新开始</button>
        <button @click="selectPlaneAgain" class="pause-btn select-plane-btn">重选战机</button>
        <button @click="goToMainMenu" class="pause-btn menu-btn">返回主菜单</button>
      </div>
    </div>
    
    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay">
      <div class="confirm-dialog">
        <h3>{{ confirmMessage }}</h3>
        <div class="confirm-buttons">
          <button @click="confirm" class="confirm-btn">确定</button>
          <button @click="cancel" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 激光样式 */
.explosion-laser {
  background: linear-gradient(to bottom, transparent, rgba(255, 0, 0, 0.8), transparent);
  position: absolute;
  z-index: 10;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 0 0 20px rgba(255, 100, 100, 0.5);
  animation: laser-pulse 0.5s infinite;
}

/* 激光脉冲动画 */
@keyframes laser-pulse {
  0%, 100% {
    opacity: 0.8;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 0 0 20px rgba(255, 100, 100, 0.5);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 100, 100, 0.8);
  }
}

/* 激光警告线样式 */
.laser-warning {
  position: absolute;
  background: rgba(255, 0, 0, 0.5);
  z-index: 5;
  box-shadow: 0 0 5px rgba(255, 0, 0, 0.8);
  animation: warning-flash 0.5s infinite;
}

/* 警告线闪烁动画 */
@keyframes warning-flash {
  0%, 50% {
    opacity: 0.3;
  }
  25%, 75% {
    opacity: 0.8;
  }
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const gameContainer = ref(null)
const gameArea = ref(null)

// 游戏状态
const gameStarted = ref(false)
const gameOver = ref(false)
const isPaused = ref(false)
const score = ref(0)
let lastFrameTime = 0 // 上一帧的时间戳，用于计算帧时间差

// 背景音乐
const backgroundMusic = ref(null)
// 敌机射击音效
const enemyShootSound = ref(null)
// 死亡射击警告音效
const deathLaserWarningSound = ref(null)
// 激光发射音效
const laserEmissionSound = ref(null)
// 玩家发射子弹音效
const playerShootSound = ref(null)
// 敌机爆炸音效
const enemyExplosionSound = ref(null)
// 敌机护盾破碎音效
const shieldBreakSound = ref(null)
// 敌机护盾开启音效
const shieldOpenSound = ref(null)
// 敌机治疗音效
const enemyHealSound = ref(null)
// 玩家受击音效
const playerHitSound = ref(null)
// 按钮悬停音效
const buttonSound = ref(null)
// 按钮点击音效
const clickSound = ref(null)
// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmAction = ref(null)
const confirmMessage = ref('')

const playerHealth = ref(100) // 第一架战机生命值
const playerHealthPercent = ref(100) // 第一架战机生命值百分比
const player2Health = ref(30) // 第二架战机生命值（仅幻影战机时使用）
const player2HealthPercent = ref(100) // 第二架战机生命值百分比（仅幻影战机时使用）

// 玩家信息
const selectedPlane = ref(null)
// 玩家模型原始尺寸（用于居中碰撞体积）
const playerModelWidth = 60;
const playerModelHeight = 60;
const player = ref({
  x: 0,
  y: 0,
  width: 3,
  height: 3,
  speed: 5, // 移速5m/s
  fireRate: 100, // 子弹发射间隔(毫秒)，每0.1秒
  lastFireTime: 0,
  isInvulnerable: false,
  invulnerableEndTime: 0
})

// 第二架战机（幻影战机专属）
const player2 = ref({
  x: 0,
  y: 0,
  width: 3,
  height: 3,
  speed: 5,
  fireRate: 100,
  lastFireTime: 0,
  isInvulnerable: false,
  invulnerableEndTime: 0,
  active: false // 是否激活
})

// 技能冷却
const skillCooldown = ref(0)
let skillCooldownMax = 15000 // 15秒冷却时间（默认）

// 技能持续状态
const skillActive = ref(false)
const skillEndTime = ref(0)
const lastHealTime = ref(0)
// 隐形状态（用于幻影战机的隐形涂装技能）
const isStealth = ref(false)
const stealthEndTime = ref(0)

// 玩家基础属性（用于技能效果重置）
const playerBaseStats = ref({
  speed: 5,
  bulletDamage: 1
})

// 第二架战机基础属性（用于技能效果重置）
const player2BaseStats = ref({})

// 游戏对象数组
const playerBullets = ref([])
const enemyBullets = ref([])
const enemies = ref([])
const explosions = ref([])

// 星星随机位置样式
const starRandomStyles = ref({
  '--rand-pos-x-1': Math.floor(Math.random() * 100),
  '--rand-pos-y-1': Math.floor(Math.random() * 100),
  '--rand-pos-x-2': Math.floor(Math.random() * 100),
  '--rand-pos-y-2': Math.floor(Math.random() * 100),
  '--rand-pos-x-3': Math.floor(Math.random() * 100),
  '--rand-pos-y-3': Math.floor(Math.random() * 100)
})

// 随机更新星星位置的函数
const updateStarPositions = () => {
  starRandomStyles.value['--rand-pos-x-1'] = Math.floor(Math.random() * 100)
  starRandomStyles.value['--rand-pos-y-1'] = Math.floor(Math.random() * 100)
  starRandomStyles.value['--rand-pos-x-2'] = Math.floor(Math.random() * 100)
  starRandomStyles.value['--rand-pos-y-2'] = Math.floor(Math.random() * 100)
  starRandomStyles.value['--rand-pos-x-3'] = Math.floor(Math.random() * 100)
  starRandomStyles.value['--rand-pos-y-3'] = Math.floor(Math.random() * 100)
}

// 定期更新星星位置
let starUpdateInterval = null
const startStarPositionUpdates = () => {
  if (starUpdateInterval) clearInterval(starUpdateInterval)
  starUpdateInterval = setInterval(updateStarPositions, 5000) // 每5秒更新一次
}

const stopStarPositionUpdates = () => {
  if (starUpdateInterval) {
    clearInterval(starUpdateInterval)
    starUpdateInterval = null
  }
}

const gameWidth = ref(0)
const gameHeight = ref(0)

// 游戏循环
let gameLoopId = null
let keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  w: false,
  a: false,
  s: false,
  d: false
}

// 加载玩家选择的战机
const loadSelectedPlane = () => {
  const saved = localStorage.getItem('selectedPlane')
  if (saved) {
    selectedPlane.value = JSON.parse(saved)
    // 特殊战机单独处理
    if (selectedPlane.value.name === '幻影战机') {
      player.value.speed = 8 // 移速8m/s
      player.value.fireRate = 100 // 每0.1秒发射一次
      playerHealth.value = 30 // 30点生命值
      skillCooldownMax = 10000 // 10秒冷却
    } else if (selectedPlane.value.name === '闪电战机') {
      player.value.speed = 5 // 移速5m/s
      player.value.fireRate = 100 // 每0.1秒发射一次
      playerHealth.value = 60 // 60点生命值
      skillCooldownMax = 15000 // 15秒冷却
    } else if (selectedPlane.value.name === '重装战机') {
      player.value.speed = 3 // 移速3m/s
      player.value.fireRate = 200 // 每0.2秒发射一次
      playerHealth.value = 100 // 100点生命值
      skillCooldownMax = 20000 // 20秒冷却
    } else if (selectedPlane.value.name === '均衡战机') {
      player.value.speed = 4 // 移速4m/s
      player.value.fireRate = 200 // 每0.2秒发射一次
      playerHealth.value = 75 // 75点生命值
      skillCooldownMax = 20000 // 20秒冷却
    } else {
      // 其他战机使用默认计算方式
      player.value.speed = selectedPlane.value.speed * 2 + 3
      player.value.fireRate = 300 - (selectedPlane.value.firepower * 30)
      playerHealth.value = selectedPlane.value.health * 25
      skillCooldownMax = 15000 // 默认15秒冷却
    }
    playerHealthPercent.value = 100
  } else {
    // 默认使用幻影战机
    selectedPlane.value = {
      index: 7, // 幻影战机索引
      name: '幻影战机',
      speed: 8,
      firepower: 2,
      health: 1.2 // 30/25 = 1.2
    }
    // 直接设置幻影战机属性
    player.value.speed = 8 // 移速8m/s
    player.value.fireRate = 100 // 每0.1秒发射一次
    playerHealth.value = 30 // 30点生命值
    playerHealthPercent.value = 100
      skillCooldownMax = 10000 // 10秒冷却
  }
  
  // 保存玩家基础属性
  playerBaseStats.value.speed = player.value.speed
  playerBaseStats.value.bulletDamage = 1 // 默认基础伤害
  
  // 重置技能状态
  skillActive.value = false
  skillEndTime.value = 0
  lastHealTime.value = 0
}

// 飞机入场动画相关状态
const isPlayerEntering = ref(true)
const playerTargetY = ref(0)
const player2TargetY = ref(0)

// 初始化游戏区域
const initGameArea = () => {
  if (gameContainer.value && gameArea.value) {
    gameWidth.value = gameArea.value.clientWidth
    gameHeight.value = gameArea.value.clientHeight
    
    // 计算目标位置
    playerTargetY.value = gameHeight.value - player.value.height - 50
    
    // 玩家初始位置设置在屏幕下方（入场动画起点）
    player.value.x = (gameWidth.value - player.value.width) / 2 - 50
    player.value.y = gameHeight.value + player.value.height // 初始位置在屏幕下方
    
    // 第二架战机初始位置（仅幻影战机时激活）
      if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
        player2.value.active = true
        player2TargetY.value = gameHeight.value - player2.value.height - 50
        player2.value.x = (gameWidth.value - player2.value.width) / 2 + 50
        player2.value.y = gameHeight.value + player2.value.height // 初始位置在屏幕下方
        // 复制玩家属性
      player2.value.speed = player.value.speed
      player2.value.fireRate = player.value.fireRate
    }
  }
}

// 处理键盘输入
const handleKeyDown = (e) => {
  // 转换按键为小写或特定键名
  let keyName = e.key.toLowerCase()
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Space') {
    keyName = e.key === ' ' ? 'Space' : e.key
  }
  
  keys[keyName] = true
  
  // 空格键释放技能
  if (keyName === 'Space' && gameStarted.value && !gameOver.value) {
    releaseSkill()
  }
}

const handleKeyUp = (e) => {
  // 转换按键为小写或特定键名
  let keyName = e.key.toLowerCase()
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Space') {
    keyName = e.key === ' ' ? 'Space' : e.key
  }
  
  keys[keyName] = false
}

// 更新玩家位置
const updatePlayer = (deltaTime) => {
  // 使用WASD键控制移动（主要战机）- 只有生命值大于0时才更新位置
  if (playerHealth.value > 0) {
    // 直接使用完整的视觉模型尺寸进行边界检查
    const visualWidth = playerModelWidth;
    const visualHeight = playerModelHeight;
    
    if ((keys['w']) && player.value.y > 0) {
      player.value.y -= player.value.speed
    }
    if ((keys['s']) && player.value.y < gameHeight.value - visualHeight) {
      player.value.y += player.value.speed
    }
    if ((keys['a']) && player.value.x > 0) {
      player.value.x -= player.value.speed
    }
    if ((keys['d']) && player.value.x < gameWidth.value - visualWidth) {
      player.value.x += player.value.speed
    }
  }
  
  // 使用方向键控制第二架战机（仅幻影战机）
  if (player2.value.active) {
    // 直接使用完整的视觉模型尺寸进行边界检查
    const visualWidth = playerModelWidth;
    const visualHeight = playerModelHeight;
    
    if ((keys['ArrowUp']) && player2.value.y > 0) {
      player2.value.y -= player2.value.speed
    }
    if ((keys['ArrowDown']) && player2.value.y < gameHeight.value - visualHeight) {
      player2.value.y += player2.value.speed
    }
    if ((keys['ArrowLeft']) && player2.value.x > 0) {
      player2.value.x -= player2.value.speed
    }
    if ((keys['ArrowRight']) && player2.value.x < gameWidth.value - visualWidth) {
      player2.value.x += player2.value.speed
    }
    
    // 检查第二架战机无敌状态
    if (player2.value.isInvulnerable && Date.now() > player2.value.invulnerableEndTime) {
      player2.value.isInvulnerable = false
    }
  }
  
  // 检查第一架战机无敌状态是否结束
  if (player.value.isInvulnerable && Date.now() > player.value.invulnerableEndTime) {
    player.value.isInvulnerable = false
  }
  
  // 处理技能持续效果（均衡战机的火力全开）
  if (skillActive.value) {
    const now = Date.now()
    
    // 检查技能是否结束
    if (now > skillEndTime.value) {
      console.log('火力全开技能结束！')
      skillActive.value = false
      
      // 恢复基础属性
      player.value.speed = playerBaseStats.value.speed
      // 恢复原始子弹发射间隔
      if (playerBaseStats.value.originalFireRate !== undefined) {
        player.value.fireRate = playerBaseStats.value.originalFireRate
        playerBaseStats.value.originalFireRate = null
      }
      playerBaseStats.value.bulletDamage = 1
      
      // 如果有第二架战机，也恢复其速度和发射间隔
      if (player2.value.active) {
        player2.value.speed = playerBaseStats.value.speed
        if (player2BaseStats.value && player2BaseStats.value.originalFireRate !== undefined) {
          player2.value.fireRate = player2BaseStats.value.originalFireRate
          player2BaseStats.value.originalFireRate = null
        }
      }
      
      // 技能结束后开始计算冷却
      skillCooldown.value = skillCooldownMax
    } else {
      // 每1秒回复1点生命值
      if (now - lastHealTime.value > 1000) {
        const maxHealth = selectedPlane.value && selectedPlane.value.name === '均衡战机' ? 75 : (selectedPlane.value ? selectedPlane.value.name === '闪电战机' ? 60 : selectedPlane.value.name === '重装战机' ? 100 : (selectedPlane.value.health * 25) : 60)
        playerHealth.value = Math.min(maxHealth, playerHealth.value + 1)
        playerHealthPercent.value = (playerHealth.value / maxHealth) * 100
        lastHealTime.value = now
      }
    }
  } else {
    // 更新技能冷却
    if (skillCooldown.value > 0) {
      // 冷却时间更新逻辑已移至gameLoop函数中
    }
  }
}

// 发射子弹
const fireBullet = () => {
  const now = Date.now()
  let bulletWidth = 4
  let bulletHeight = 15
  let bulletSpeed = 5
  let bulletDamage = 1
  
  // 根据战机类型设置不同的子弹属性
  if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
    // 重装战机：每0.2秒发射一枚子弹，弹速3m/s，2点伤害
    bulletWidth = 6
    bulletHeight = 20
    bulletSpeed = 3
    bulletDamage = 2
  } else if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
    // 幻影战机：每0.1秒发射一枚子弹，弹速5m/s，5点伤害
    bulletSpeed = 5
    bulletDamage = 5
  } else if (selectedPlane.value && selectedPlane.value.name === '闪电战机') {
    // 闪电战机：每0.1秒发射一枚子弹，弹速5m/s，1点伤害
    bulletSpeed = 5
    bulletDamage = 1
  } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
    // 均衡战机：每0.2秒发射一枚子弹，弹速4m/s，1点伤害
    bulletSpeed = 4
    bulletDamage = 1
  }
  
  // 应用技能增强效果
  if (skillActive.value) {
    bulletDamage += 1
  }
  
  // 第一架战机发射子弹 - 只有生命值大于0时才发射
  if (playerHealth.value > 0 && now - player.value.lastFireTime > player.value.fireRate) {
    // 播放玩家发射子弹音效
    playPlayerShootSound()
    // 计算战机模型中心位置（基于原始模型尺寸60x60）
    const playerCenterX = player.value.x + (playerModelWidth - player.value.width) / 2 + player.value.width / 2;
    const playerCenterY = player.value.y + (playerModelHeight - player.value.height) / 2 + player.value.height / 2;
    
    // 闪电战机特殊弹道处理
      if (selectedPlane.value && selectedPlane.value.name === '闪电战机') {
        // 闪电战机：向90°、180°、270°方向发射子弹
        const angles = [90, 180, 270];
      
      angles.forEach(angleDeg => {
        // 将角度转换为弧度
        const angleRad = (angleDeg * Math.PI) / 180;
        
        // 每个角度发射两颗子弹
        for (let i = 0; i < 2; i++) {
          // 计算子弹初始位置，添加微小偏移使两颗子弹稍微分开
          const offset = (i - 0.5) * 5; // -2.5和+2.5的偏移
          const initialX = playerCenterX - bulletWidth / 2 + Math.cos(angleRad) * offset;
          const initialY = playerCenterY - bulletHeight / 2 - Math.sin(angleRad) * offset;
          
          // 添加子弹，使用speedX和speedY来实现不同角度的弹道
          playerBullets.value.push({
            x: initialX,
            y: initialY,
            width: bulletWidth,
            height: bulletHeight,
            speedX: Math.sin(angleRad) * bulletSpeed, // 水平速度分量
            speedY: Math.cos(angleRad) * bulletSpeed, // 垂直速度分量
            damage: bulletDamage,
            isGold: skillActive.value // 技能激活时子弹为金色
          })
        }
      })
    } else if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
      // 重装战机：每次发射3枚子弹，保持弹道不变
      for (let i = 0; i < 3; i++) {
        // 计算子弹水平偏移，使3枚子弹呈水平排列
        const offsetX = (i - 1) * 10; // -10, 0, 10的偏移
        playerBullets.value.push({
          x: playerCenterX - bulletWidth / 2 + offsetX,
          y: player.value.y + (playerModelHeight - player.value.height) / 2 - bulletHeight / 2,
          width: bulletWidth,
          height: bulletHeight,
          speed: bulletSpeed,
          damage: bulletDamage,
          isGold: skillActive.value // 技能激活时子弹为金色
        })
      }
    } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
      // 均衡战机：向180° 195° 165° 90° 270°方向发射子弹
      const angles = [180, 195, 165, 90, 270];
      
      angles.forEach(angleDeg => {
        // 将角度转换为弧度
        const angleRad = (angleDeg * Math.PI) / 180;
        
        // 计算子弹初始位置（从战机中心发射）
        const initialX = playerCenterX - bulletWidth / 2;
        const initialY = playerCenterY - bulletHeight / 2;
        
        // 添加子弹，使用speedX和speedY来实现不同角度的弹道
        playerBullets.value.push({
          x: initialX,
          y: initialY,
          width: bulletWidth,
          height: bulletHeight,
          speedX: Math.sin(angleRad) * bulletSpeed, // 水平速度分量
          speedY: Math.cos(angleRad) * bulletSpeed, // 垂直速度分量
          damage: bulletDamage,
          isGold: skillActive.value // 技能激活时子弹为金色
        })
      })
    } else {
      // 其他战机：普通弹道
      playerBullets.value.push({
        x: playerCenterX - bulletWidth / 2,
        y: player.value.y + (playerModelHeight - player.value.height) / 2 - bulletHeight / 2,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed,
        damage: bulletDamage,
        isGold: skillActive.value // 技能激活时子弹为金色
      })
    }
    
    player.value.lastFireTime = now
  }
  
  // 第二架战机发射子弹（仅幻影战机时，且生命值大于0）
  if (player2.value.active && player2Health.value > 0 && selectedPlane.value && selectedPlane.value.name === '幻影战机' && now - player2.value.lastFireTime > player2.value.fireRate) {
    // 播放玩家发射子弹音效
    playPlayerShootSound()
    // 计算第二架战机模型中心位置（基于原始模型尺寸60x60）
    const player2CenterX = player2.value.x + (playerModelWidth - player2.value.width) / 2 + player2.value.width / 2;
    
    playerBullets.value.push({
      x: player2CenterX - bulletWidth / 2,
      y: player2.value.y + (playerModelHeight - player2.value.height) / 2 - bulletHeight / 2,
      width: bulletWidth,
      height: bulletHeight,
      speed: bulletSpeed,
      damage: bulletDamage,
      isGold: skillActive.value // 技能激活时子弹为金色
    })
    
    player2.value.lastFireTime = now
  }
}

// 更新子弹位置
const updateBullets = () => {
  // 玩家子弹
  playerBullets.value = playerBullets.value.filter(bullet => {
    // 支持带有speedX和speedY的子弹（技能子弹）
    if (bullet.speedX !== undefined && bullet.speedY !== undefined) {
      bullet.x += bullet.speedX
      bullet.y += bullet.speedY
    } else {
      // 普通子弹只沿Y轴移动
      bullet.y -= bullet.speed
    }
    return bullet.y > -bullet.height && bullet.y < gameHeight.value && 
           bullet.x > -bullet.width && bullet.x < gameWidth.value
  })
  
  // 敌机子弹
  enemyBullets.value = enemyBullets.value.filter(bullet => {
    // 支持带有speedX和speedY的子弹（如先锋号的fiveAngles弹道）
    if (bullet.speedX !== undefined && bullet.speedY !== undefined) {
      bullet.x += bullet.speedX
      bullet.y += bullet.speedY
    } else {
      // 普通子弹只沿Y轴移动
      bullet.y += bullet.speed
    }
    // 子弹撞到游戏边框（上下左右）时直接销毁
    return bullet.y < gameHeight.value && 
           bullet.y > -bullet.height && 
           bullet.x > -bullet.width && 
           bullet.x < gameWidth.value
  })
}

// 生成敌机
// 敌机数据配置
const enemyConfigs = {
  1: { // 普通战机
    width: 50,
    height: 50,
    health: 5,
    speed: 0,
    fireRate: 2000,
    damage: 1,
    score: 1,
    movementPattern: 'fixed',
    bulletsPerAttack: 5
  },
  2: { // 干扰战机
    width: 60,
    height: 60,
    health: 2,
    speed: 3,
    fireRate: 500,
    damage: 1,
    score: 1,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 1,
    moveRange: 50,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1,
    lastFireTime: Date.now(),
    lastMoveTime: Date.now()
  },
  3: { // 重型战机
    width: 70,
    height: 70,
    health: 10,
    speed: 1,
    fireRate: 5000,
    damage: 2,
    score: 1,
    movementPattern: 'horizontal',
    bulletsPerAttack: 10,
    directionX: Math.random() > 0.5 ? 1 : -1,
    lastMoveTime: Date.now()
  },
  4: { // 医疗支援小队
    width: 90,
    height: 90,
    health: 15,
    speed: 5,
    fireRate: 0, // 不进行攻击
    damage: 0, // 伤害为0
    score: 5,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 0, // 不发射子弹
    specialAbility: 'healing',
    teamSize: 3,
    healingRate: 3000,
    healingAmount: 3,
    lastHealTime: Date.now(),
    moveRange: 70,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1
  },
  5: { // 先锋号
    width: 100,
    height: 80,
    health: 25,
    speed: 8,
    fireRate: 1000,
    damage: 2,
    score: 5,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 1,
    bulletPattern: 'fiveAngles',
    moveRange: 80,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1,
    lastFireTime: Date.now(),
    // 死亡射击特殊能力
    specialAbility: 'deathLaser',
    laserRate: 10000, // 10秒发射一次
    laserDamage: 15, // 造成15点伤害
    laserWarningTime: 5000, // 5秒警告时间
    laserWidth: 20, // 激光宽度
    lastLaserTime: Date.now(),
    isLaserWarning: false,
    laserWarningEndTime: 0
  },
  6: { // 战盾
    width: 110,
    height: 100,
    health: 25,
    speed: 3,
    fireRate: 2500,
    damage: 15,
    score: 5,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 1,
    specialAbility: 'shield',
    shieldRate: 8000,
    shieldStrength: 5,
    hasShield: false,
    shieldEndTime: 0,
    lastShieldTime: Date.now(),
    moveRange: 60,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1
  },
  7: { // 魔王号
    width: 140,
    height: 140,
    health: 100,
    speed: 5,
    fireRate: 500, // 每0.5秒发射一次
    damage: 3,
    score: 10,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 1,
    bulletPattern: 'fullCircle', // 360度全方位发射
    damageBoost: 2,
    // 死亡射击特殊能力
    specialAbility: 'deathLaser',
    laserRate: 8000, // 8秒发射一次（比先锋号更频繁）
    laserDamage: 20, // 造成20点伤害（比先锋号更强）
    laserWarningTime: 4000, // 4秒警告时间
    laserWidth: 30, // 激光宽度更大
    lastLaserTime: Date.now(),
    isLaserWarning: false,
    laserWarningEndTime: 0,
    moveRange: 100,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1,
    isBoss: true
  },
  8: { // 魔女号
    width: 130,
    height: 150,
    health: 75,
    speed: 0, // 固定位置，不移动
    fireRate: 1000,
    damage: 8,
    score: 10,
    movementPattern: 'fixed', // 固定位置
    bulletsPerAttack: 1,
    bulletPattern: 'multiAngle',
    moveRange: 120,
    directionX: 0,
    directionY: 0,
    isBoss: true,
    // 天女散花技能
    specialAbility: 'scatterShot',
    scatterShotRate: 8000, // 冷却时间8秒
    scatterShotDuration: 3000, // 持续时间3秒
    scatterShotBulletCount: 270, // 发射270枚子弹
    scatterShotBulletSpeed: 2, // 子弹速度2m/s
    scatterShotBulletDamage: 10, // 子弹伤害10
    // 护盾技能（从战盾继承）
    secondSpecialAbility: 'shield',
    shieldRate: 8000,
    shieldStrength: 5,
    hasShield: false,
    shieldEndTime: 0,
    lastShieldTime: Date.now(),
    lastScatterShotTime: Date.now(),
    isScatterShotActive: false,
    scatterShotEndTime: 0
  }
}

const spawnEnemy = () => {
  let type, config
  
  // 根据分数决定敌机类型
  const eliteCount = enemies.value.filter(enemy => enemy.type >= 4 && enemy.type <= 6).length
  
  if (score.value >= 20 && eliteCount < 2 && Math.random() < 0.3) {
    // 30%概率生成精英敌机
    type = 4 + Math.floor(Math.random() * 3)
  } else {
    // 生成普通小兵敌机（1, 2, 3中的一个）
    type = 1 + Math.floor(Math.random() * 3)
  }
  
  config = enemyConfigs[type]
  
  // 计算游戏上半区的范围
  const halfHeight = gameHeight.value / 2
  
  // 克隆配置对象
  if (type === 4) {
    // 医疗支援小队特殊处理：1单位生成3个敌机
    // 限制最多2组（每组3个，共6个）
    const currentMedicCount = enemies.value.filter(e => e.type === 4).length
    if (currentMedicCount < 6) {
      // 计算生成3个敌机的位置，形成一个小队
      const centerX = Math.random() * (gameWidth.value - config.width)
      const targetY = Math.random() * (halfHeight - config.height)
      
      // 生成3个医疗支援小队成员
      for (let i = 0; i < 3; i++) {
        // 创建敌机实例
        const enemy = { ...config }
        
        // 设置略微不同的位置，形成小队阵型
        enemy.x = centerX + (i % 3 - 1) * 50 // 左右偏移
        
        // 添加生成动画相关属性
        enemy.isSpawning = true // 标记正在生成动画中
        enemy.spawnStartY = -enemy.height // 生成起始位置（屏幕上方）
        enemy.spawnTargetY = targetY + Math.floor(i / 3) * 30 // 目标位置
        enemy.y = enemy.spawnStartY // 初始位置
        
        // 确保在屏幕范围内
        enemy.x = Math.max(0, Math.min(enemy.x, gameWidth.value - enemy.width))
        
        // 初始化其他属性
        enemy.maxHealth = config.health
        enemy.lastFireTime = Date.now()
        enemy.type = type
        enemy.lastHealTime = Date.now()
        enemy.spawnStartTime = Date.now() // 记录生成开始时间
        
        // 为每个敌机分配不同的移动方向
        enemy.directionX = Math.random() > 0.5 ? 1 : -1
        enemy.directionY = Math.random() > 0.5 ? 1 : -1
        
        enemies.value.push(enemy)
      }
    }
  } else {
    // 其他类型敌机生成逻辑
    const targetY = Math.random() * (halfHeight - config.height)
    const enemy = { ...config }
    enemy.x = Math.random() * (gameWidth.value - config.width)
    
    // 添加生成动画相关属性
    enemy.isSpawning = true // 标记正在生成动画中
    enemy.spawnStartY = -enemy.height // 生成起始位置（屏幕上方）
    enemy.spawnTargetY = targetY // 目标位置
    enemy.y = enemy.spawnStartY // 初始位置
    
    enemy.maxHealth = config.health
    enemy.lastFireTime = Date.now()
    enemy.type = type
    enemy.spawnStartTime = Date.now() // 记录生成开始时间
        
    // 为特殊能力初始化时间
    if (enemy.specialAbility === 'deathLaser') {
      enemy.lastLaserTime = Date.now()
      enemy.isLaserWarning = false
    }
        
    enemies.value.push(enemy)
  }
}

// 更新敌机
const updateEnemies = () => {
  // 检查是否需要生成Boss敌机（每50分出现一次）
  const bossCount = enemies.value.filter(enemy => enemy.type >= 7).length
  const lastBossScore = window.lastBossScore || 0
  
  if (bossCount === 0 && score.value >= 50 && Math.floor(score.value / 50) > Math.floor(lastBossScore / 50)) {
    // 随机生成Boss敌机类型 (7, 8)
    const bossType = 7 + Math.floor(Math.random() * 2)
    const config = enemyConfigs[bossType]
    
    // 克隆配置对象
    const boss = { ...config }
    
    // 生成Boss敌机，居中显示
    const halfHeight = gameHeight.value / 2
    boss.x = (gameWidth.value - boss.width) / 2
    
    // 添加生成动画相关属性
    boss.isSpawning = true // 标记正在生成动画中
    boss.spawnStartY = -boss.height // 生成起始位置（屏幕上方）
    boss.spawnTargetY = (halfHeight - boss.height) / 2 // 目标位置（居中在上半部分）
    boss.y = boss.spawnStartY // 初始位置
    
    boss.maxHealth = boss.health
    boss.lastFireTime = Date.now()
    boss.type = bossType
    boss.isBoss = true
    boss.spawnStartTime = Date.now() // 记录生成开始时间
    
    enemies.value.push(boss)
    
    // 更新最后一次生成Boss的分数
    window.lastBossScore = score.value
  }
  
  const now = Date.now()
  const halfHeight = gameHeight.value / 2
  
  // 应用伤害增益
  const damageBoost = calculateDamageBoost()
  
  enemies.value = enemies.value.filter(enemy => {
    // 应用伤害增益
    const effectiveDamage = enemy.damage + damageBoost
    
    // 实现敌机移动模式
    updateEnemyMovement(enemy, halfHeight)
    
    // 实现特殊能力
    handleSpecialAbilities(enemy, now)
    
    // 实现敌机开火
    if (enemy.fireRate > 0 && now - enemy.lastFireTime > enemy.fireRate) {
      fireEnemyBullets(enemy, effectiveDamage, now)
    }
    
    // 只保留在上半部分的敌机
    return enemy.y < halfHeight + enemy.height
  })
  
  // 定期生成敌机，限制场上最多10个单位敌机，不包括精英敌机
  const regularEnemyCount = enemies.value.filter(enemy => enemy.type >= 1 && enemy.type <= 3).length
  if (Math.random() < 0.02 && regularEnemyCount < 10) {
    spawnEnemy()
  }
}

// 计算伤害增益
const calculateDamageBoost = () => {
  let boost = 0
  enemies.value.forEach(enemy => {
    if (enemy.damageBoost) {
      boost += enemy.damageBoost
    }
  })
  return boost
}

// 更新敌机移动
const updateEnemyMovement = (enemy, halfHeight) => {
  // 处理生成动画
  if (enemy.isSpawning) {
    const spawnDuration = 1000 // 生成动画持续时间（毫秒）
    const now = Date.now()
    const spawnProgress = Math.min(1, (now - enemy.spawnStartTime) / spawnDuration)
    
    // 使用缓动函数让动画更自然
    const easeOutQuad = t => t * (2 - t)
    const easedProgress = easeOutQuad(spawnProgress)
    
    // 计算当前位置
    enemy.y = enemy.spawnStartY + (enemy.spawnTargetY - enemy.spawnStartY) * easedProgress
    
    // 动画完成
    if (spawnProgress >= 1) {
      enemy.isSpawning = false
      enemy.y = enemy.spawnTargetY // 确保精确到达目标位置
      
      // 清理生成动画相关属性
      delete enemy.spawnStartY
      delete enemy.spawnTargetY
      delete enemy.spawnStartTime
    }
    
    // 在生成动画期间，不执行其他移动逻辑
    return
  }
  
  // 正常移动逻辑
  switch (enemy.movementPattern) {
    case 'fixed':
      // 固定位置，不移动
      break
    case 'horizontal':
      // 左右横移
      enemy.x += enemy.speed * enemy.directionX
      if (enemy.x <= 0 || enemy.x + enemy.width >= gameWidth.value) {
        enemy.directionX *= -1
      }
      break
    case 'horizontalVertical':
      // 左右横移+上下移动
      enemy.x += enemy.speed * 0.5 * enemy.directionX
      enemy.y += enemy.speed * 0.5 * enemy.directionY
      
      // 边界检查
      if (enemy.x <= 0 || enemy.x + enemy.width >= gameWidth.value) {
        enemy.directionX *= -1
      }
      if (enemy.y <= 0 || enemy.y + enemy.height >= halfHeight) {
        enemy.directionY *= -1
      }
      break
  }
  
  // 确保敌机不会移动到屏幕下半部分
  if (enemy.y > halfHeight - enemy.height) {
    enemy.y = halfHeight - enemy.height
  }
}

// 处理特殊能力
const handleSpecialAbilities = (enemy, now) => {
  // 处理第二个特殊能力（如果存在）
  if (enemy.secondSpecialAbility === 'shield') {
    // 定期生成护盾
    if (!enemy.hasShield && now - enemy.lastShieldTime > enemy.shieldRate) {
      // 播放护盾开启音效
      playShieldOpenSound()
      // 为场上所有敌机提供护盾
      enemies.value.forEach(ally => {
        ally.hasShield = true
        // 重置护盾值为初始值
        ally.shieldStrength = ally.shieldStrength || enemyConfigs[ally.type]?.shieldStrength || 5
        ally.shieldEndTime = now + 3000 // 护盾持续3秒
      })
      enemy.lastShieldTime = now
    }
    // 护盾时间检查
    // 为每个敌机单独检查护盾时间
    enemies.value.forEach(ally => {
      if (ally.hasShield && now > ally.shieldEndTime) {
        ally.hasShield = false
      }
    })
  }
  // 处理天女散花技能
  if (enemy.specialAbility === 'scatterShot') {
    // 检查是否可以激活技能
    if (!enemy.isScatterShotActive && now - enemy.lastScatterShotTime > enemy.scatterShotRate) {
      console.log('魔女号释放天女散花技能！')
      enemy.isScatterShotActive = true
      enemy.scatterShotEndTime = now + enemy.scatterShotDuration
      
      // 计算每秒需要发射的子弹数量（总子弹数/持续时间）
      const bulletsPerSecond = enemy.scatterShotBulletCount / (enemy.scatterShotDuration / 1000)
      enemy.bulletsToFirePerFrame = bulletsPerSecond / 60 // 假设60fps
      enemy.accumulatedBullets = 0
    }
    
    // 技能激活状态下发射子弹
    if (enemy.isScatterShotActive) {
      // 增加累积的子弹数
      enemy.accumulatedBullets += enemy.bulletsToFirePerFrame
      
      // 发射累积的子弹
      while (enemy.accumulatedBullets >= 1) {
        const angleRad = Math.random() * 2 * Math.PI // 随机角度（0到2π）
        const speedX = Math.sin(angleRad) * enemy.scatterShotBulletSpeed
        const speedY = Math.cos(angleRad) * enemy.scatterShotBulletSpeed
        
        // 计算战盾和拥有护盾技能的魔女号的数量，每有一个就增加1点伤害（可叠加）
        let finalDamage = enemy.scatterShotBulletDamage
        const shieldSupportCount = enemies.value.filter(e => 
          (e.type === 6 && e.health > 0) || 
          (e.type === 8 && e.health > 0 && e.secondSpecialAbility === 'shield')
        ).length
        finalDamage += shieldSupportCount
        
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 10,
          y: enemy.y + enemy.height / 2 - 10,
          width: 20,
          height: 20,
          speedX: speedX,
          speedY: speedY,
          damage: finalDamage,
          isScatterShot: true, // 标记为天女散花子弹
          isScatterShotBullet: true // 用于样式和碰撞检测的特殊标识
        })
        
        enemy.accumulatedBullets -= 1
      }
      
      // 检查技能是否结束
      if (now > enemy.scatterShotEndTime) {
        enemy.isScatterShotActive = false
        enemy.lastScatterShotTime = now
        console.log('魔女号天女散花技能结束！')
      }
    }
  }
  
  // 医疗支援小队治疗：每3秒恢复场上所有敌机3点生命值
  // 检查场上是否有医疗支援小队
  const hasMedicSquad = enemies.value.some(e => e.type === 4)
  
  // 为第一个遇到的医疗支援小队执行治疗效果，避免重复执行
  if (enemy.specialAbility === 'healing' && hasMedicSquad && now - enemy.lastHealTime > enemy.healingRate) {
    // 播放治疗音效
    playEnemyHealSound()
    // 恢复场上所有敌机的生命值
    enemies.value.forEach(ally => {
      if (ally.health < ally.maxHealth) {
        ally.health = Math.min(ally.health + enemy.healingAmount, ally.maxHealth)
        // 添加治疗效果动画 - 显示绿色特效
        ally.showHealingEffect = true
        // 2秒后移除治疗效果
        setTimeout(() => {
          ally.showHealingEffect = false
        }, 2000)
      }
    })
    // 更新所有医疗支援小队的治疗时间，确保同步
    enemies.value.forEach(medic => {
      if (medic.type === 4 && medic.specialAbility === 'healing') {
        medic.lastHealTime = now
      }
    })
  }
  
  // 战盾护盾 - 守护技能：为所有队友提供护盾
  if (enemy.specialAbility === 'shield') {
    // 定期生成护盾
    if (!enemy.hasShield && now - enemy.lastShieldTime > enemy.shieldRate) {
      // 播放护盾开启音效
      playShieldOpenSound()
      // 为场上所有敌机提供护盾
      enemies.value.forEach(ally => {
        ally.hasShield = true
        // 重置护盾值为初始值
        ally.shieldStrength = ally.shieldStrength || enemyConfigs[ally.type]?.shieldStrength || 5
        ally.shieldEndTime = now + 3000 // 护盾持续3秒
      })
      enemy.lastShieldTime = now
    }
    // 护盾时间检查
    // 为每个敌机单独检查护盾时间
    enemies.value.forEach(ally => {
      if (ally.hasShield && now > ally.shieldEndTime) {
        ally.hasShield = false
      }
    })
  }
  
  // 先锋号死亡射击特殊能力
  if (enemy.specialAbility === 'deathLaser') {
    // 检查是否可以开始激光警告
    if (!enemy.isLaserWarning && now - enemy.lastLaserTime > enemy.laserRate) {
      // 随机选择3个不同的激光位置
      enemy.laserPositions = []
      for (let i = 0; i < 3; i++) {
        // 确保位置不重叠
        let validPosition = false
        let position
        
        while (!validPosition) {
          position = Math.random() * (gameWidth.value - enemy.laserWidth)
          validPosition = true
          
          // 检查与已有位置的距离是否足够
          for (const existingPos of enemy.laserPositions) {
            if (Math.abs(position - existingPos) < enemy.laserWidth * 2) {
              validPosition = false
              break
            }
          }
        }
        
        enemy.laserPositions.push(position)
      }
      
      enemy.isLaserWarning = true
      enemy.laserWarningEndTime = now + enemy.laserWarningTime
      
      // 播放死亡射击警告音效（循环播放）
      playDeathLaserWarningSound(enemy)
    }
    
    // 检查激光警告是否结束，发射激光
    if (enemy.isLaserWarning && now >= enemy.laserWarningEndTime) {
      // 发射3条激光
      for (const laserX of enemy.laserPositions) {
        // 添加激光效果
        explosions.value.push({
          x: laserX,
          y: 0,
          frame: 0,
          timer: 0,
          isLaser: true,
          width: enemy.laserWidth,
          height: gameHeight.value,
          damage: enemy.laserDamage
        })
      }
      
      // 播放激光发射音效
      playLaserEmissionSound()
      
      // 停止警告音效
      stopDeathLaserWarningSound(enemy)
      
      // 重置激光状态
      enemy.isLaserWarning = false
      enemy.lastLaserTime = now
      enemy.laserPositions = null
    }
  }
  
  // Boss敌机特殊能力
  if (enemy.isBoss) {
    // 预留Boss特殊能力位置
  }
}

// 发射敌机子弹
const fireEnemyBullets = (enemy, damage, now) => {
  const bulletsPerAttack = enemy.bulletsPerAttack || 1
  
  // 计算战盾和拥有护盾技能的魔女号的数量，每有一个就增加1点伤害（可叠加）
  let finalDamage = damage
  const shieldSupportCount = enemies.value.filter(e => 
    (e.type === 6 && e.health > 0) || 
    (e.type === 8 && e.health > 0 && e.secondSpecialAbility === 'shield')
  ).length
  finalDamage = damage + shieldSupportCount
  
  // 移除重复的魔王号增益检查，因为魔王号的damageBoost属性已经通过calculateDamageBoost函数提供了团队增益效果
  
  switch (enemy.bulletPattern) {
    case 'fullCircle':
      // 360度全方位发射，每30度一个角度（0度到360度）
      for (let angleDeg = 0; angleDeg < 360; angleDeg += 30) {
        const angleRad = (angleDeg * Math.PI) / 180; // 转换为弧度
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 10,
          y: enemy.y + enemy.height / 2 - 10,
          width: 20,
          height: 20,
          speedX: Math.sin(angleRad) * 10, // 水平速度分量，总速度为10m/s
          speedY: Math.cos(angleRad) * 10, // 垂直速度分量，总速度为10m/s
          damage: finalDamage,
          isDevilBullet: enemy.type === 7 // 为魔王号的子弹添加特殊标识
        })
      }
      break
    case 'fiveAngles':
      // 5条不同角度的弹道（-30度、-10度、0度、10度、30度）
      const angles = [-Math.PI/6, -Math.PI/18, 0, Math.PI/18, Math.PI/6];
      for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 3,
          y: enemy.y + enemy.height / 2 - 3,
          width: 6,
          height: 6,
          speedX: Math.sin(angle) * 10, // 水平速度分量，总速度为10m/s
          speedY: 10, // 垂直速度为10m/s
          damage: finalDamage,
          isVanguardBullet: enemy.type === 5 // 为先锋号的子弹添加特殊标识
        })
      }
      break
    case 'multiAngle':
      // 315度至45度每隔15度有一条弹道，135度至255度每隔15度有一条弹道
      // 发射右侧半区域弹道（315度到45度，每隔15度）
      // 处理跨越0度的范围
      for (let angleDeg = 315; angleDeg <= 360; angleDeg += 15) {
        const angleRad = (angleDeg * Math.PI) / 180;
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 10,
          y: enemy.y + enemy.height / 2 - 10,
          width: 20,
          height: 20,
          speedX: Math.sin(angleRad) * 10, // 水平速度分量，总速度为10m/s
          speedY: Math.cos(angleRad) * 10, // 垂直速度分量，总速度为10m/s
          damage: finalDamage,
          isWitchBullet: enemy.type === 8 // 为魔女号的子弹添加特殊标识
        })
      }
      for (let angleDeg = 0; angleDeg <= 45; angleDeg += 15) {
        const angleRad = (angleDeg * Math.PI) / 180;
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 10,
          y: enemy.y + enemy.height / 2 - 10,
          width: 20,
          height: 20,
          speedX: Math.sin(angleRad) * 10, // 水平速度分量，总速度为10m/s
          speedY: Math.cos(angleRad) * 10, // 垂直速度分量，总速度为10m/s
          damage: finalDamage,
          isWitchBullet: enemy.type === 8 // 为魔女号的子弹添加特殊标识
        })
      }
      // 发射左侧半区域弹道（135度到225度，每隔15度）- 去掉240°和255°的弹道
      for (let angleDeg = 135; angleDeg <= 225; angleDeg += 15) {
        const angleRad = (angleDeg * Math.PI) / 180;
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 10,
          y: enemy.y + enemy.height / 2 - 10,
          width: 20,
          height: 20,
          speedX: Math.sin(angleRad) * 10, // 水平速度分量，总速度为10m/s
          speedY: Math.cos(angleRad) * 10, // 垂直速度分量，总速度为10m/s
          damage: finalDamage,
          isWitchBullet: enemy.type === 8 // 为魔女号的子弹添加特殊标识
        })
      }
      break
    default:
      // 普通弹道
      for (let i = 0; i < bulletsPerAttack; i++) {
        const offset = (i - bulletsPerAttack / 2 + 0.5) * 10
        enemyBullets.value.push({
          x: enemy.x + enemy.width / 2 - 3 + offset,
          y: enemy.y + enemy.height,
          width: 6,
          height: 15,
          speed: 3,
          damage: finalDamage,
          isShieldBullet: enemy.type === 6 // 为战盾的子弹添加特殊标识
        })
      }
  }
  
  enemy.lastFireTime = now
  
  // 播放敌机射击音效
  playEnemyShootSound()
}

// 检测碰撞
const checkCollisions = () => {
  // 玩家子弹和敌机碰撞
  for (let i = playerBullets.value.length - 1; i >= 0; i--) {
    const bullet = playerBullets.value[i]
    
    for (let j = enemies.value.length - 1; j >= 0; j--) {
      const enemy = enemies.value[j]
      
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        
        // 使用子弹的damage属性造成伤害，默认1点
        const damage = bullet.damage || 1
        
        // 处理护盾效果
        if (enemy.hasShield && enemy.shieldStrength > 0) {
          // 护盾吸收伤害
          enemy.shieldStrength -= damage
          if (enemy.shieldStrength <= 0) {
            enemy.hasShield = false
            enemy.shieldStrength = 0
            // 添加护盾破碎效果
            explosions.value.push({
              x: enemy.x,
              y: enemy.y,
              frame: 0,
              timer: 0,
              isShieldBreak: true
            })
            // 播放护盾破碎音效
            playShieldBreakSound()
          }
        } else {
          // 直接对生命值造成伤害
          enemy.health -= damage
        }
        
        // 移除子弹
        playerBullets.value.splice(i, 1)
        
        // 敌机被摧毁
        if (enemy.health <= 0) {
          // 停止死亡射击警告音效
          if (enemy.specialAbility === 'deathLaser' && enemy.isLaserWarning) {
            stopDeathLaserWarningSound(enemy)
          }
          
          // 添加爆炸效果
          explosions.value.push({
            x: enemy.x,
            y: enemy.y,
            frame: 0,
            timer: 0
          })
          
          // 播放敌机爆炸音效
          playEnemyExplosionSound()
          
          // 增加分数
          score.value += enemy.score || 1
          
          // 移除敌机
          enemies.value.splice(j, 1)
        }
        
        break
      }
    }
  }
  
  // 敌机子弹和玩家碰撞
    for (let i = enemyBullets.value.length - 1; i >= 0; i--) {
      const bullet = enemyBullets.value[i]
      let bulletHit = false
      
      // 检查第一架战机 - 碰撞体积居中（3x3像素）
      const playerCenterX = player.value.x + (playerModelWidth - 3) / 2;
      const playerCenterY = player.value.y + (playerModelHeight - 3) / 2;
      
      if (!player.value.isInvulnerable && playerHealth.value > 0) {
        if (bullet.isDevilBullet || bullet.isWitchBullet || bullet.isScatterShotBullet) {
          // 魔王号子弹使用圆形碰撞检测
          const bulletRadius = bullet.width / 2; // 子弹半径
          const bulletCenterX = bullet.x + bulletRadius;
          const bulletCenterY = bullet.y + bulletRadius;
          
          // 计算子弹中心和玩家碰撞点之间的距离
          const dx = bulletCenterX - playerCenterX;
          const dy = bulletCenterY - playerCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果距离小于子弹半径，发生碰撞
          if (distance < bulletRadius) {
            // 第一架战机受伤，使用子弹的damage属性
            const damage = bullet.damage || 1
            playerHealth.value -= damage
            bulletHit = true
            // 播放玩家受击音效
            playPlayerHitSound()
            
            // 如果第一架战机生命值归0，将其标记为非活动
            if (playerHealth.value <= 0) {
              // 添加爆炸效果
              explosions.value.push({
                x: player.value.x,
                y: player.value.y,
                frame: 0,
                timer: 0
              })
              // 确保血条百分比更新为0%
              playerHealthPercent.value = 0
            }
          }
        } else {
          // 普通矩形碰撞检测
          if (bullet.x < playerCenterX + player.value.width &&
              bullet.x + bullet.width > playerCenterX &&
              bullet.y < playerCenterY + player.value.height &&
              bullet.y + bullet.height > playerCenterY) {
            
            // 第一架战机受伤，使用子弹的damage属性
            const damage = bullet.damage || 1
            playerHealth.value -= damage
            bulletHit = true
            // 播放玩家受击音效
            playPlayerHitSound()
            
            // 如果第一架战机生命值归0，将其标记为非活动
            if (playerHealth.value <= 0) {
              // 添加爆炸效果
              explosions.value.push({
                x: player.value.x,
                y: player.value.y,
                frame: 0,
                timer: 0
              })
              // 确保血条百分比更新为0%
              playerHealthPercent.value = 0
            }
          }
        }
      }
      
      // 检查第二架战机（仅幻影战机时） - 碰撞体积居中（3x3像素）
      const player2CenterX = player2.value.x + (playerModelWidth - 3) / 2;
      const player2CenterY = player2.value.y + (playerModelHeight - 3) / 2;
      
      if (player2.value.active &&
          !player2.value.isInvulnerable && player2Health.value > 0) {
        if (bullet.isDevilBullet || bullet.isWitchBullet || bullet.isScatterShotBullet) {
          // 魔王号子弹使用圆形碰撞检测
          const bulletRadius = bullet.width / 2; // 子弹半径
          const bulletCenterX = bullet.x + bulletRadius;
          const bulletCenterY = bullet.y + bulletRadius;
          
          // 计算子弹中心和玩家碰撞点之间的距离
          const dx = bulletCenterX - player2CenterX;
          const dy = bulletCenterY - player2CenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果距离小于子弹半径，发生碰撞
          if (distance < bulletRadius) {
            // 第二架战机受伤，使用子弹的damage属性
            const damage = bullet.damage || 1
            player2Health.value -= damage
            bulletHit = true
            // 播放玩家受击音效
            playPlayerHitSound()
            
            // 如果第二架战机生命值归0，将其标记为非活动
            if (player2Health.value <= 0) {
              // 添加爆炸效果
              explosions.value.push({
                x: player2.value.x,
                y: player2.value.y,
                frame: 0,
                timer: 0
              })
              // 确保血条百分比更新为0%
              player2HealthPercent.value = 0
            }
          }
        } else {
          // 普通矩形碰撞检测
          if (bullet.x < player2CenterX + player2.value.width &&
              bullet.x + bullet.width > player2CenterX &&
              bullet.y < player2CenterY + player2.value.height &&
              bullet.y + bullet.height > player2CenterY) {
            
            // 第二架战机受伤，使用子弹的damage属性
            const damage = bullet.damage || 1
            player2Health.value -= damage
            bulletHit = true
            // 播放玩家受击音效
            playPlayerHitSound()
            
            // 如果第二架战机生命值归0，将其标记为非活动
            if (player2Health.value <= 0) {
              // 添加爆炸效果
              explosions.value.push({
                x: player2.value.x,
                y: player2.value.y,
                frame: 0,
                timer: 0
              })
              // 确保血条百分比更新为0%
              player2HealthPercent.value = 0
            }
          }
        }
      }
      
      // 如果子弹击中了任何一架战机
      if (bulletHit) {
        // 非幻影战机或未激活第二架战机时，使用通用生命值计算
        if (!(selectedPlane.value && selectedPlane.value.name === '幻影战机') || !player2.value.active) {
          // 根据不同战机计算生命值百分比
          if (selectedPlane.value && selectedPlane.value.name === '闪电战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 60) * 100)
          } else if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 100) * 100)
          } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 75) * 100)
          } else if (selectedPlane.value) {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / (selectedPlane.value.health * 25)) * 100)
          }
        } else {
          // 幻影战机的单独生命值计算
          const maxHealth = 30 // 幻影战机单架最大生命值
          playerHealthPercent.value = Math.max(0, (playerHealth.value / maxHealth) * 100)
          player2HealthPercent.value = Math.max(0, (player2Health.value / maxHealth) * 100)
        }
        
        // 移除子弹
    enemyBullets.value.splice(i, 1)
    
    // 进入无敌状态
    if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
          // 幻影战机的无敌处理
          if (playerHealth.value > 0) {
            player.value.isInvulnerable = true
            player.value.invulnerableEndTime = Date.now() + 2000
          }
          if (player2Health.value > 0) {
            player2.value.isInvulnerable = true
            player2.value.invulnerableEndTime = Date.now() + 2000
          }
          
          // 游戏结束：只有当两架战机都被摧毁时才结束游戏
          if (playerHealth.value <= 0 && player2Health.value <= 0) {
            endGame()
          }
        } else {
          // 其他战机的无敌处理
          if (playerHealth.value > 0) {
            activateInvulnerability()
            // 如果有第二架战机，也激活无敌状态
            if (player2.value.active) {
              player2.value.isInvulnerable = true
              player2.value.invulnerableEndTime = Date.now() + 2000
            }
          }
          
          // 游戏结束
          if (playerHealth.value <= 0) {
            endGame()
          }
        }
      }
    }
  
  // 敌机和玩家碰撞机制已移除
  
  // 检查激光与玩家的碰撞
  for (let i = explosions.value.length - 1; i >= 0; i--) {
    const explosion = explosions.value[i]
    
    // 只处理激光类型的爆炸效果
    if (explosion.isLaser) {
      // 检查第一架战机是否与激光碰撞 - 使用居中碰撞体积
      const playerCenterX = player.value.x + (playerModelWidth - 3) / 2;
      const playerCenterY = player.value.y + (playerModelHeight - 3) / 2;
      if (!player.value.isInvulnerable && playerHealth.value > 0 &&
          playerCenterX < explosion.x + explosion.width &&
          playerCenterX + player.value.width > explosion.x &&
          playerCenterY < explosion.y + explosion.height &&
          playerCenterY + player.value.height > explosion.y) {
        
        // 第一架战机受到激光伤害
        playerHealth.value -= explosion.damage || 0
        // 播放玩家受击音效
        playPlayerHitSound()
        
        // 更新生命值百分比
        if (!(selectedPlane.value && selectedPlane.value.name === '幻影战机')) {
          if (selectedPlane.value && selectedPlane.value.name === '闪电战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 60) * 100)
          } else if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 100) * 100)
          } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / 75) * 100)
          } else if (selectedPlane.value) {
            playerHealthPercent.value = Math.max(0, (playerHealth.value / (selectedPlane.value.health * 25)) * 100)
          }
        }
        
        // 如果第一架战机生命值归0，添加爆炸效果
        if (playerHealth.value <= 0) {
          // 确保血条百分比更新为0%
          playerHealthPercent.value = 0
          explosions.value.push({
            x: player.value.x,
            y: player.value.y,
            frame: 0,
            timer: 0
          })
          
          // 如果不是幻影战机或第二架战机未激活，游戏结束
          if (!(selectedPlane.value && selectedPlane.value.name === '幻影战机') || !player2.value.active) {
            endGame()
          }
        }
      }
      
      // 检查第二架战机是否与激光碰撞（仅幻影战机时） - 使用居中碰撞体积
      const player2CenterX = player2.value.x + (playerModelWidth - 3) / 2;
      const player2CenterY = player2.value.y + (playerModelHeight - 3) / 2;
      if (player2.value.active &&
          !player2.value.isInvulnerable && player2Health.value > 0 &&
          player2CenterX < explosion.x + explosion.width &&
          player2CenterX + player2.value.width > explosion.x &&
          player2CenterY < explosion.y + explosion.height &&
          player2CenterY + player2.value.height > explosion.y) {
        
        // 第二架战机受到激光伤害
        player2Health.value -= explosion.damage || 0
        // 播放玩家受击音效
        playPlayerHitSound()
        
        // 更新幻影战机第二架的生命值百分比
        if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
          const maxHealth = 30 // 幻影战机单架最大生命值
          player2HealthPercent.value = Math.max(0, (player2Health.value / maxHealth) * 100)
        }
        
        // 如果第二架战机生命值归0，添加爆炸效果
        if (player2Health.value <= 0) {
          // 确保血条百分比更新为0%
          player2HealthPercent.value = 0
          explosions.value.push({
            x: player2.value.x,
            y: player2.value.y,
            frame: 0,
            timer: 0
          })
        }
      }
      
      // 幻影战机游戏结束检查：两架战机都被摧毁
      if (selectedPlane.value && selectedPlane.value.name === '幻影战机' &&
          playerHealth.value <= 0 && player2Health.value <= 0) {
        endGame()
      }
    }
  }
}

// 更新爆炸效果
const updateExplosions = (deltaTime) => {
  const now = Date.now()
  explosions.value = explosions.value.filter(explosion => {
    // 处理普通爆炸动画
    if (!explosion.isShieldBreak && !explosion.isExplosion) {
      explosion.timer += deltaTime
      if (explosion.timer > 100) {
        explosion.frame++
        explosion.timer = 0
      }
      return explosion.frame < 4 // 4帧爆炸动画
    }
    // 处理护盾破碎效果
    else if (explosion.isShieldBreak) {
      explosion.timer += deltaTime
      if (explosion.timer > 50) {
        explosion.frame++
        explosion.timer = 0
      }
      return explosion.frame < 3 // 3帧护盾破碎动画
    }

    return false
  })
}

// 释放技能
const releaseSkill = () => {
  // 检查技能冷却
  if (skillCooldown.value > 0) {
    console.log(`技能冷却中: ${Math.ceil(skillCooldown.value / 1000)}秒`)
    return
  }
  
  // 根据战机类型释放不同技能
  if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
    // 隐形涂装：开启后8秒内不可被选中（无敌）
    console.log('激活隐形涂装技能！')
    isStealth.value = true
    stealthEndTime.value = Date.now() + 8000 // 持续8秒
    
    // 设置两架战机为无敌状态
    player.value.isInvulnerable = true
    player.value.invulnerableEndTime = stealthEndTime.value
    if (player2.value.active) {
      player2.value.isInvulnerable = true
      player2.value.invulnerableEndTime = stealthEndTime.value
    }
    
    // 添加紫色视觉效果 - 幻影战机特殊效果
    explosions.value.push({
      x: player.value.x - player.value.width,
      y: player.value.y - player.value.height,
      frame: 0,
      timer: 0,
      stealth: true // 标记为隐形技能特效
    })
    if (player2.value.active) {
      explosions.value.push({
        x: player2.value.x - player2.value.width,
        y: player2.value.y - player2.value.height,
        frame: 0,
        timer: 0,
        stealth: true // 标记为隐形技能特效
      })
    }
    
    // 技能持续时间结束后计算冷却，不立即开始
  } else if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
    // 装甲修复：回复自身35%的血量
    console.log('释放装甲修复技能！')
    const maxHealth = selectedPlane.value.name === '重装战机' ? 100 : (selectedPlane.value.health * 25)
    const healAmount = maxHealth * 0.35 // 回复35%血量
    playerHealth.value = Math.min(maxHealth, playerHealth.value + healAmount)
    playerHealthPercent.value = (playerHealth.value / maxHealth) * 100
    
    // 添加绿色视觉效果 - 重装战机特殊效果
    explosions.value.push({
      x: player.value.x - player.value.width / 2,
      y: player.value.y - player.value.height / 2,
      frame: 0,
      timer: 0,
      armor: true // 标记为装甲修复技能特效
    })
  } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
    // 火力全开：开启技能后，每秒回复1点血量，子弹伤害+1，移速+2，子弹发射间隔缩短至0.002秒，持续15秒
    console.log('释放火力全开技能！')
    skillActive.value = true
    skillEndTime.value = Date.now() + 15000 // 持续15秒
    lastHealTime.value = Date.now()
    
    // 增强属性
    player.value.speed = playerBaseStats.value.speed + 2
    // 保存原始发射间隔并设置为极短
    playerBaseStats.value.originalFireRate = player.value.fireRate
  player.value.fireRate = 50 // 0.5秒发射一次
    // 如果有第二架战机，也增强其速度和发射频率
    if (player2.value.active) {
      player2.value.speed = playerBaseStats.value.speed + 2
      player2BaseStats.value = player2BaseStats.value || {}
      player2BaseStats.value.originalFireRate = player2.value.fireRate
  player2.value.fireRate = 50
    }
    playerBaseStats.value.bulletDamage = 1
    
    // 添加金色视觉反馈效果 - 均衡战机特殊效果
    explosions.value.push({
      x: player.value.x - player.value.width,
      y: player.value.y - player.value.height,
      frame: 0,
      timer: 0,
      balance: true // 标记为均衡战机技能特效
    })
  } else {
    // 闪电战机冲击波：清除场上所有小兵敌机和敌人的子弹
    console.log('释放冲击波技能！')
    
    // 添加视觉反馈效果 - 战机自身位置的爆炸特效
    explosions.value.push({
      x: player.value.x - player.value.width,
      y: player.value.y - player.value.height,
      frame: 0,
      timer: 0
    })
    
    // 清除敌人子弹
    enemyBullets.value.forEach(bullet => {
      // 为每个被清除的子弹添加爆炸效果
      explosions.value.push({
        x: bullet.x,
        y: bullet.y,
        frame: 0,
        timer: 0
      })
    })
    enemyBullets.value = []
    
    // 清除小兵敌机（type 1、2、3的敌机被视为小兵）
    const enemiesToRemove = []
    enemies.value.forEach((enemy, index) => {
      if (enemy.type === 1 || enemy.type === 2 || enemy.type === 3) { // 清除所有小兵
        enemiesToRemove.push(index)
        // 为每个被清除的敌机添加爆炸效果
        explosions.value.push({
          x: enemy.x,
          y: enemy.y,
          frame: 0,
          timer: 0
        })
        // 增加分数
        score.value += enemy.score || 1
      }
    })
    
    // 从后往前移除，避免索引问题
    for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
      enemies.value.splice(enemiesToRemove[i], 1)
    }
  }
  
  // 为所有战机设置冷却时间
  skillCooldown.value = skillCooldownMax
}

// 激活无敌状态
const activateInvulnerability = () => {
  player.value.isInvulnerable = true
  player.value.invulnerableEndTime = Date.now() + 2000 // 2秒无敌时间
}

// 游戏主循环
const gameLoop = () => {
  if (!gameStarted.value || gameOver.value || isPaused.value) return
  
  // 计算当前帧与上一帧的时间差（毫秒）
  const now = Date.now()
  const deltaTime = lastFrameTime ? (now - lastFrameTime) : 16.67 // 默认16.67ms作为第一帧
  lastFrameTime = now
  
  // 检查幻影战机的生命值，将生命值为0的战机标记为非显示
  if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
    // 如果第一架战机生命值为0，将其标记为不可见（但仍保留在DOM中以维持结构）
    if (playerHealth.value <= 0) {
      // 保持战机在DOM中但不渲染或移动
    }
    
    // 如果第二架战机生命值为0，将其active状态设置为false
    if (player2Health.value <= 0) {
      player2.value.active = false
    }
  }
  
  // 更新玩家控制逻辑
  updatePlayer(deltaTime)
  
  // 只有生命值大于0的战机才发射子弹
  if (playerHealth.value > 0 || (player2.value.active && player2Health.value > 0)) {
    fireBullet()
  }
  
  updateBullets()
  updateEnemies()
  checkCollisions()
  updateExplosions(deltaTime)
  
  // 注意：技能结束时的状态还原已在updatePlayer函数中处理
  
  // 更新隐形状态
  if (isStealth.value && Date.now() > stealthEndTime.value) {
    // 隐形技能结束
    isStealth.value = false
    // 开始计算冷却
    skillCooldown.value = skillCooldownMax
  }
  
  // 更新技能冷却
  if (skillCooldown.value > 0) {
    skillCooldown.value = Math.max(0, skillCooldown.value - deltaTime)
  }
  
  // 更新无敌状态
  if (player.value.isInvulnerable && now > player.value.invulnerableEndTime) {
    player.value.isInvulnerable = false
  }
  if (player2.value.isInvulnerable && now > player2.value.invulnerableEndTime) {
    player2.value.isInvulnerable = false
  }
  
  gameLoopId = requestAnimationFrame(gameLoop)
}

// 开始游戏
const startGameLoop = () => {
  gameStarted.value = true
  isPaused.value = false
  gameLoopId = requestAnimationFrame(gameLoop)
  startStarPositionUpdates()
  
  // 播放背景音乐
  playBackgroundMusic()
}

// 播放背景音乐
const playBackgroundMusic = () => {
  if (!backgroundMusic.value) {
    backgroundMusic.value = new Audio('/music/《8-Bit Pulse in the Galactic Battlefield》.mp3')
    backgroundMusic.value.loop = true // 设置循环播放
    backgroundMusic.value.volume = 0.3 // 设置音量为30%
  }
  
  // 尝试播放音乐
  backgroundMusic.value.play().catch(error => {
    console.log('自动播放音乐失败，等待用户交互后再播放:', error)
  })
}

// 播放敌机射击音效
const playEnemyShootSound = () => {
  if (!enemyShootSound.value) {
    enemyShootSound.value = new Audio('/music/Enemy aircraft shooting sound effect.MP3')
    enemyShootSound.value.volume = 0.5 // 设置音量为50%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = enemyShootSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放敌机射击音效失败:', error)
  })
}

// 播放死亡射击警告音效（循环播放）
const playDeathLaserWarningSound = (enemy) => {
  // 停止之前可能在播放的警告音效
  if (enemy.currentWarningSound) {
    enemy.currentWarningSound.pause()
    enemy.currentWarningSound = null
  }
  
  if (!deathLaserWarningSound.value) {
    deathLaserWarningSound.value = new Audio('/music/Death Shot Warning.MP3')
    deathLaserWarningSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象并设置循环播放
  const soundClone = deathLaserWarningSound.value.cloneNode()
  soundClone.loop = true // 设置为循环播放
  
  // 存储音效引用到敌人对象上，方便后续停止
  enemy.currentWarningSound = soundClone
  
  soundClone.play().catch(error => {
    console.log('播放死亡射击警告音效失败:', error)
  })
}

// 停止死亡射击警告音效
const stopDeathLaserWarningSound = (enemy) => {
  if (enemy.currentWarningSound) {
    enemy.currentWarningSound.pause()
    enemy.currentWarningSound = null
  }
}

// 播放激光发射音效
const playLaserEmissionSound = () => {
  if (!laserEmissionSound.value) {
    laserEmissionSound.value = new Audio('/music/Laser emission.MP3')
    laserEmissionSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象以支持多音效同时播放
  const soundClone = laserEmissionSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放激光发射音效失败:', error)
  })
}

// 播放玩家发射子弹音效
const playPlayerShootSound = () => {
  if (!playerShootSound.value) {
    playerShootSound.value = new Audio('/music/Fighter jet launch.MP3')
    playerShootSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = playerShootSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放玩家发射子弹音效失败:', error)
  })
}

// 播放敌机爆炸音效
const playEnemyExplosionSound = () => {
  if (!enemyExplosionSound.value) {
    enemyExplosionSound.value = new Audio('/music/Enemy plane crashed.mp3')
    enemyExplosionSound.value.volume = 0.5 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = enemyExplosionSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放敌机爆炸音效失败:', error)
  })
}

// 播放敌机护盾破碎音效
const playShieldBreakSound = () => {
  if (!shieldBreakSound.value) {
    shieldBreakSound.value = new Audio('/music/Shield Broken.mp3')
    shieldBreakSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = shieldBreakSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放敌机护盾破碎音效失败:', error)
  })
}

// 播放敌机护盾开启音效
const playShieldOpenSound = () => {
  if (!shieldOpenSound.value) {
    shieldOpenSound.value = new Audio('/music/Shield.mp3')
    shieldOpenSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = shieldOpenSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放敌机护盾开启音效失败:', error)
  })
}

// 播放敌机治疗音效
const playEnemyHealSound = () => {
  if (!enemyHealSound.value) {
    enemyHealSound.value = new Audio('/music/Medical.MP3')
    enemyHealSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = enemyHealSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放敌机治疗音效失败:', error)
  })
}

// 播放玩家受击音效
const playPlayerHitSound = () => {
  if (!playerHitSound.value) {
    playerHitSound.value = new Audio('/music/Under attack.mp3')
    playerHitSound.value.volume = 0.7 // 设置音量为70%
  }
  
  // 克隆音效对象来允许多个音效同时播放
  const soundClone = playerHitSound.value.cloneNode()
  soundClone.play().catch(error => {
    console.log('播放玩家受击音效失败:', error)
  })
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

// 暂停游戏
const pauseGame = () => {
  isPaused.value = true
  cancelAnimationFrame(gameLoopId)
  stopStarPositionUpdates()
  
  // 暂停背景音乐
  if (backgroundMusic.value) {
    backgroundMusic.value.pause()
  }
}

// 继续游戏
const resumeGame = () => {
  playClickSound()
  isPaused.value = false
  gameLoopId = requestAnimationFrame(gameLoop)
  startStarPositionUpdates()
  
  // 恢复背景音乐
  if (backgroundMusic.value) {
    backgroundMusic.value.play().catch(error => {
      console.log('继续播放音乐失败:', error)
    })
  }
}

// 显示确认对话框
const showConfirm = (action, message) => {
  confirmAction.value = action
  confirmMessage.value = message
  showConfirmDialog.value = true
}

// 确认操作
const confirm = () => {
  playClickSound()
  showConfirmDialog.value = false
  if (confirmAction.value) {
    confirmAction.value()
    confirmAction.value = null
  }
}

// 取消操作
const cancel = () => {
  playClickSound()
  showConfirmDialog.value = false
  confirmAction.value = null
}

// 重选战机（带确认对话框）
const selectPlaneAgain = () => {
  playClickSound()
  showConfirm(() => {
    router.push('/select-plane')
  }, '确定要重选战机吗？当前游戏进度将会丢失。')
}

// 重选战机（直接跳转，用于游戏结束菜单）
const selectPlaneAgainDirect = () => {
  playClickSound()
  router.push('/select-plane')
}

// 返回主菜单
const goToMainMenu = () => {
  playClickSound()
  showConfirm(() => {
    router.push('/')
  }, '确定要返回主菜单吗？当前游戏进度将会丢失。')
}

// 结束游戏
const endGame = () => {
  gameOver.value = true
  cancelAnimationFrame(gameLoopId)
  stopStarPositionUpdates()
  
  // 停止背景音乐
  if (backgroundMusic.value) {
    backgroundMusic.value.pause()
  }
  
  // 保存分数到排行榜
  const rankings = JSON.parse(localStorage.getItem('gameRankings') || '[]')
  rankings.push({
    score: score.value,
    date: new Date().toLocaleString()
  })
  
  // 按分数排序
  rankings.sort((a, b) => b.score - a.score)
  
  // 只保留前10名
  if (rankings.length > 10) {
    rankings.length = 10
  }
  
  localStorage.setItem('gameRankings', JSON.stringify(rankings))
}

// 重新开始
const restartGame = () => {
  // 如果是从暂停菜单调用，需要确认
  if (isPaused.value) {
    showConfirm(() => {
      performRestart()
    }, '确定要重新开始游戏吗？当前游戏进度将会丢失。')
  } else {
    // 从游戏结束界面调用，不需要确认
    performRestart()
  }
}

// 执行重新开始的实际操作
const performRestart = () => {
  gameOver.value = false
  isPaused.value = false
  score.value = 0
    
    // 重置玩家生命值
    if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
      playerHealth.value = 30
      player2Health.value = 30
      playerHealthPercent.value = 100
      player2HealthPercent.value = 100
    } else if (selectedPlane.value && selectedPlane.value.name === '闪电战机') {
      playerHealth.value = 60
      playerHealthPercent.value = 100
    } else if (selectedPlane.value && selectedPlane.value.name === '重装战机') {
      playerHealth.value = 100
      playerHealthPercent.value = 100
    } else if (selectedPlane.value && selectedPlane.value.name === '均衡战机') {
      playerHealth.value = 75
      playerHealthPercent.value = 100
    } else {
      playerHealth.value = selectedPlane.value.health * 25
      playerHealthPercent.value = 100
    }
  
  playerBullets.value = []
  enemyBullets.value = []
  
  // 重置玩家位置
  player.value.x = (gameWidth.value - player.value.width) / 2 - 50
  player.value.y = gameHeight.value - player.value.height - 50
  player.value.isInvulnerable = false
  player.value.lastFireTime = 0
  
  // 重置第二架战机状态（仅幻影战机时）
  player2.value.isInvulnerable = false
  player2.value.lastFireTime = 0
  player2.value.active = selectedPlane.value && selectedPlane.value.name === '幻影战机'
  if (player2.value.active) {
    player2.value.x = (gameWidth.value - player2.value.width) / 2 + 50
    player2.value.y = gameHeight.value - player2.value.height - 50
    player2.value.speed = player.value.speed
    player2.value.fireRate = player.value.fireRate
  }
  enemies.value = []
  explosions.value = []
  
  // 重置技能冷却和状态
  skillCooldown.value = 0
  skillActive.value = false
  skillEndTime.value = 0
  lastHealTime.value = 0
  isStealth.value = false
  stealthEndTime.value = 0
  
  // 重置玩家位置和状态
  player.value.x = (gameWidth.value - player.value.width) / 2 - 50
  player.value.y = gameHeight.value - player.value.height - 50
  player.value.isInvulnerable = false
  player.value.invulnerableEndTime = 0
  
  // 重置第二架战机（仅幻影战机时）
  if (selectedPlane.value && selectedPlane.value.name === '幻影战机') {
    player2.value.active = true
    player2.value.x = (gameWidth.value - player2.value.width) / 2 + 50
    player2.value.y = gameHeight.value - player2.value.height - 50
    player2.value.isInvulnerable = false
    player2.value.invulnerableEndTime = 0
    // 复制玩家属性
    player2.value.speed = player.value.speed
    player2.value.fireRate = player.value.fireRate
  } else {
    player2.value.active = false
  }
  
  // 重新加载战机属性以确保正确重置
  loadSelectedPlane()
  
  nextTick(() => {
    gameStarted.value = true
    gameLoopId = requestAnimationFrame(gameLoop)
  })
}

// 去排行榜
const goToRanking = () => {
  router.push('/ranking')
}

// 飞机入场动画函数
const animatePlayerEntrance = () => {
  const duration = 1500 // 动画持续时间（毫秒）
  const startTime = Date.now()
  const startY = player.value.y
  const startY2 = player2.value.y
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数使动画更自然
    const easeOutQuad = 1 - (1 - progress) * (1 - progress)
    
    // 更新玩家位置
    player.value.y = startY - (startY - playerTargetY.value) * easeOutQuad
    
    // 更新第二架战机位置（如果是幻影战机）
    if (player2.value.active) {
      player2.value.y = startY2 - (startY2 - player2TargetY.value) * easeOutQuad
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // 动画完成，设置飞机为目标位置
      player.value.y = playerTargetY.value
      if (player2.value.active) {
        player2.value.y = player2TargetY.value
      }
      isPlayerEntering.value = false
    }
  }
  
  requestAnimationFrame(animate)
}

// 生命周期
onMounted(() => {
  loadSelectedPlane()
  nextTick(() => {
    initGameArea()
    // 开始飞机入场动画
    animatePlayerEntrance()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    // 添加ESC键暂停游戏
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gameStarted.value && !gameOver.value) {
        if (isPaused.value) {
          resumeGame()
        } else {
          pauseGame()
        }
      }
    })
    
    // 为所有按钮添加鼠标悬停音效
    setTimeout(() => {
      const buttons = document.querySelectorAll('.pause-btn, .confirm-btn, .cancel-btn')
      buttons.forEach(button => {
        button.addEventListener('mouseover', playButtonSound)
      })
      
      // 监听动态添加的按钮（如游戏结束时的按钮）
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              const newButtons = node.querySelectorAll('button')
              newButtons.forEach(button => {
                button.addEventListener('mouseover', playButtonSound)
              })
            }
          })
        })
      })
      
      if (gameContainer.value) {
        observer.observe(gameContainer.value, {
          childList: true,
          subtree: true
        })
        
        // 保存observer引用以便在组件卸载时清理
        window._buttonSoundObserver = observer
      }
    }, 100)
  })
})

onUnmounted(() => {
  cancelAnimationFrame(gameLoopId)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  
  // 清理背景音乐
  if (backgroundMusic.value) {
    backgroundMusic.value.pause()
    backgroundMusic.value = null
  }
  
  // 清理按钮悬停音效事件监听器
  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    button.removeEventListener('mouseover', playButtonSound)
  })
  
  // 清理MutationObserver
  if (window._buttonSoundObserver) {
    window._buttonSoundObserver.disconnect()
    window._buttonSoundObserver = null
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
.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #0a0a1a 0%, #10102a 50%, #0a0a2a 100%);
}

/* 确认对话框样式 */
.confirm-dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background: linear-gradient(135deg, #000033 0%, #000066 50%, #000099 100%);
  border: 2px solid #00ffff;
  border-radius: 10px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.confirm-dialog h3 {
  color: white;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}

.confirm-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.confirm-btn, .cancel-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.confirm-btn {
  background: linear-gradient(135deg, #ff0000, #ff6666);
  color: white;
}

.confirm-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
}

.cancel-btn {
  background: linear-gradient(135deg, #333333, #666666);
  color: white;
}

.cancel-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(102, 102, 102, 0.7);
}

/* 宇宙背景 */
.game-container {
  background: linear-gradient(to bottom, #0a0a1a, #10102a, #0a0a1a);
  position: relative;
  overflow: hidden;
}

/* 主星空背景 - 静态星星层 */
.game-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  left: -50%;
  top: -50%;
  background-image: 
    radial-gradient(white 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px);
  background-size: 100px 100px, 70px 70px, 50px 50px, 30px 30px;
  background-position: 0 0, 25px 25px, 10px 10px, 40px 40px;
  opacity: 0.3;
  animation: starsMove 200s linear infinite;
  z-index: 1;
  pointer-events: none;
}

/* 闪烁星星层 */
.game-container::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(white 1px, transparent 1px),
    radial-gradient(rgba(255, 223, 186, 0.9) 1px, transparent 1px),
    radial-gradient(rgba(173, 216, 230, 0.9) 1px, transparent 1px);
  background-size: 80px 80px, 120px 120px, 150px 150px;
  background-position: 
    calc(var(--rand-pos-x-1) * 1%) calc(var(--rand-pos-y-1) * 1%),
    calc(var(--rand-pos-x-2) * 1%) calc(var(--rand-pos-y-2) * 1%),
    calc(var(--rand-pos-x-3) * 1%) calc(var(--rand-pos-y-3) * 1%);
  opacity: 0.6;
  animation: 
    starsTwinkle 2s infinite, 
    starsMove 250s linear infinite;
  z-index: 1;
  pointer-events: none;
}

/* 星云效果 */
.nebula-effect {
  position: absolute;
  width: 300%;
  height: 300%;
  left: -100%;
  top: -100%;
  background: 
    radial-gradient(circle at 30% 40%, rgba(100, 100, 200, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(200, 100, 150, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(50, 150, 200, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 10% 20%, rgba(150, 100, 200, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 30%, rgba(100, 200, 150, 0.06) 0%, transparent 50%);
  animation: nebulaMove 300s linear infinite;
  z-index: 1;
  pointer-events: none;
}

/* 银河效果 */
.galaxy-effect {
  position: absolute;
  width: 200%;
  height: 100%;
  left: -50%;
  top: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(100, 100, 200, 0.05) 20%, 
    rgba(150, 150, 255, 0.1) 50%, 
    rgba(100, 100, 200, 0.05) 80%, 
    transparent 100%);
  animation: galaxyMove 150s linear infinite;
  z-index: 1;
  pointer-events: none;
  transform: perspective(500px) rotateX(30deg);
}

@keyframes starsMove {
  from {
    transform: translateY(0) translateX(0);
  }
  to {
    transform: translateY(-50%) translateX(-25%);
  }
}

@keyframes nebulaMove {
  from {
    transform: rotate(0deg) scale(1);
  }
  to {
    transform: rotate(360deg) scale(1.5);
  }
}

@keyframes galaxyMove {
  from {
    transform: perspective(500px) rotateX(30deg) translateX(0);
  }
  to {
    transform: perspective(500px) rotateX(30deg) translateX(-50%);
  }
}

@keyframes starsTwinkle {
  0%, 100% {
    opacity: 0.6;
  }
  20% {
    opacity: 0.2;
  }
  40% {
    opacity: 0.8;
  }
  60% {
    opacity: 0.4;
  }
  80% {
    opacity: 1;
  }
}

.game-area {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
}

/* 开始游戏遮罩 */
.game-start-overlay,
.game-over-overlay,
.game-pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: auto;
}

.start-info,
.game-over-info,
.pause-info {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  color: white;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  position: relative;
  z-index: 101;
}

.start-info h2,
.game-over-info h2,
.pause-info h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
}

.start-info p,
.game-over-info p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #ffffff;
}

.start-info button,
.game-over-info button,
.pause-btn {
  margin: 1rem;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, #00ffff, #0984e3);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.5);
  position: relative;
  z-index: 102;
  pointer-events: auto;
}

/* HUD左侧布局 */
  .hud-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* 暂停按钮样式 */
  .pause-button {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    font-weight: bold;
    color: white;
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.5);
  }

.pause-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.7);
}

/* 暂停弹窗按钮样式 */
.pause-btn {
  display: block;
  margin: 1rem auto;
  min-width: 200px;
}

.pause-btn.continue-btn {
  background: linear-gradient(45deg, #4ade80, #16a34a);
  box-shadow: 0 5px 15px rgba(74, 222, 128, 0.5);
}

.pause-btn.continue-btn:hover {
  box-shadow: 0 10px 25px rgba(74, 222, 128, 0.7);
}

.pause-btn.restart-btn {
  background: linear-gradient(45deg, #60a5fa, #2563eb);
  box-shadow: 0 5px 15px rgba(96, 165, 250, 0.5);
}

.pause-btn.restart-btn:hover {
  box-shadow: 0 10px 25px rgba(96, 165, 250, 0.7);
}

.pause-btn.select-plane-btn {
  background: linear-gradient(45deg, #a78bfa, #6d28d9);
  box-shadow: 0 5px 15px rgba(167, 139, 250, 0.5);
}

.pause-btn.select-plane-btn:hover {
  box-shadow: 0 10px 25px rgba(167, 139, 250, 0.7);
}

.pause-btn.menu-btn {
  background: linear-gradient(45deg, #ff6b6b, #dc2626);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.5);
}

.pause-btn.menu-btn:hover {
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.7);
}

.start-info button:hover,
.game-over-info button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 255, 255, 0.7);
}

/* 游戏界面HUD */
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 50;
}

.score,
.level,
.skill-cooldown,
.skill-active,
.skill-ready {
  font-size: 1.2rem;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
}

.skill-cooldown {
  color: #ff6b6b;
  animation: pulse 1s infinite;
}

.skill-active {
  color: #4ade80;
  animation: glow 0.5s infinite alternate;
}

.skill-ready {
  color: #ffd700;
  animation: glow 0.5s infinite alternate;
}

/* 移除单独的goldGlow动画，统一使用glow动画 */

@keyframes glow {
  from {
    text-shadow: 0 0 10px #4ade80;
  }
  to {
    text-shadow: 0 0 20px #4ade80, 0 0 30px #4ade80;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.health {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin-bottom: 0.5rem;
  z-index: 100;
}

.health-bar {
  width: 150px;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
  transition: width 0.3s ease;
  box-shadow: 0 0 5px rgba(255, 107, 107, 0.7);
}

/* 幻影战机的两架战机生命条样式 */
/* 为幻影战机血条创建垂直排列的容器 */
.phantom-health-container {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 5px 0;
  z-index: 100;
}

/* 重置幻影战机血条的定位，让它们在容器内垂直排列 */
.health.health-1 {
  position: static;
  transform: none;
  margin-bottom: 0;
  color: #ff00ff;
  text-shadow: 0 0 5px #ff00ff;
}

.health.health-2 {
  position: static;
  transform: none;
  margin-bottom: 0;
  color: #0066ff;
  text-shadow: 0 0 5px #0066ff;
}

.health.health-1 .health-fill {
  background: linear-gradient(90deg, #ff00ff, #9900ff);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
}



.health.health-2 .health-fill {
  background: linear-gradient(90deg, #003399, #0066ff);
  box-shadow: 0 0 10px rgba(0, 102, 255, 0.7);
}

/* 玩家战机 */
.player-plane {
  position: absolute;
  width: 60px;
  height: 60px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 10;
  transition: opacity 0.1s;
}

/* 无敌状态闪烁效果 */
.player-plane.invulnerable {
  animation: blink 0.2s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.player-plane-0 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L90 60 L80 60 L50 40 L20 60 L10 60 Z' fill='%23ff6b6b' stroke='white' stroke-width='2'/%3E%3Cpath d='M40 60 L50 80 L60 60' fill='%23ff6b6b' stroke='white' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='5' fill='%2300ffff'/%3E%3C/svg%3E");
}

.player-plane-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 15 L95 50 L80 60 L20 60 L5 50 Z' fill='%2354a0ff' stroke='white' stroke-width='2'/%3E%3Cpath d='M30 60 L50 85 L70 60' fill='%2354a0ff' stroke='white' stroke-width='2'/%3E%3Cpath d='M30 50 L20 55 L30 60' fill='%23ff0000' stroke='white' stroke-width='1'/%3E%3Cpath d='M70 50 L80 55 L70 60' fill='%23ff0000' stroke='white' stroke-width='1'/%3E%3C/svg%3E");
}

.player-plane-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='30' width='50' height='30' fill='%23ee5a24' stroke='white' stroke-width='2'/%3E%3Cpath d='M50 10 L25 30 M50 10 L75 30 M50 60 L35 80 M50 60 L65 80' stroke='white' stroke-width='3'/%3E%3Cpath d='M15 40 L25 45 M85 40 L75 45 M15 50 L25 45 M85 50 L75 45' stroke='%2300ffff' stroke-width='2'/%3E%3C/svg%3E");
}

.player-plane-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 15 L85 50 L75 55 L25 55 L15 50 Z' fill='%2300d2d3' stroke='white' stroke-width='2'/%3E%3Cpath d='M35 55 L50 75 L65 55' fill='%2300d2d3' stroke='white' stroke-width='2'/%3E%3Ccircle cx='40' cy='45' r='3' fill='%23ff0000'/%3E%3Ccircle cx='60' cy='45' r='3' fill='%23ff0000'/%3E%3Ccircle cx='50' cy='30' r='4' fill='yellow' stroke='white'/%3E%3C/svg%3E");
}

/* 闪电战机临时图标 - 预留接口以便后期添加自定义外观设计 */
.player-plane-4 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='30' y='20' width='40' height='50' rx='5' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Cpath d='M30 20 L50 0 L70 20' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Cpath d='M40 70 L50 90 L60 70' fill='%2300ffff' stroke='%2300ff00' stroke-width='2'/%3E%3Ccircle cx='45' cy='50' r='4' fill='%23ff00ff'/%3E%3Ccircle cx='55' cy='50' r='4' fill='%23ff00ff'/%3E%3Cpath d='M20 40 L30 30 M80 40 L70 30' stroke='%23ffff00' stroke-width='3' stroke-dasharray='5,3'/%3E%3C/svg%3E");
}

/* 重装战机临时图标 - 预留接口以便后期添加自定义外观设计 */
.player-plane-5 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='30' width='50' height='40' rx='5' fill='%23990000' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 40 L25 30 M85 40 L75 30' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 50 L25 50 M85 50 L75 50' stroke='%23ff6600' stroke-width='3'/%3E%3Cpath d='M15 60 L25 60 M85 60 L75 60' stroke='%23ff6600' stroke-width='3'/%3E%3Ccircle cx='40' cy='45' r='5' fill='%23ffcc00' stroke='%23ffff00' stroke-width='1'/%3E%3Ccircle cx='60' cy='45' r='5' fill='%23ffcc00' stroke='%23ffff00' stroke-width='1'/%3E%3Crect x='35' y='65' width='30' height='10' rx='2' fill='%23663300' stroke='%23996600' stroke-width='2'/%3E%3Cpath d='M45 75 L50 90 L55 75' fill='%23663300' stroke='%23996600' stroke-width='2'/%3E%3C/svg%3E");
}

/* 均衡战机临时图标 - 预留接口以便后期添加自定义外观设计 */
.player-plane-6 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L90 40 L80 50 L20 50 L10 40 Z' fill='%230066cc' stroke='%2300ccff' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%230066cc' stroke='%2300ccff' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Ccircle cx='60' cy='40' r='4' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Cpath d='M20 30 L30 20 M80 30 L70 20' stroke='%2300ccff' stroke-width='2'/%3E%3Cpath d='M25 60 L30 70 M75 60 L70 70' stroke='%2300ccff' stroke-width='2'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%2300ccff' stroke='%230066cc' stroke-width='1'/%3E%3C/svg%3E");
}

/* 均衡战机技能期间金色外观 */
.player-plane-6.skill-active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L90 40 L80 50 L20 50 L10 40 Z' fill='%23daa520' stroke='%23ffd700' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%23daa520' stroke='%23ffd700' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%23ffd700' stroke='%23ffed4a' stroke-width='1'/%3E%3Ccircle cx='60' cy='40' r='4' fill='%23ffd700' stroke='%23ffed4a' stroke-width='1'/%3E%3Cpath d='M20 30 L30 20 M80 30 L70 20' stroke='%23ffd700' stroke-width='2'/%3E%3Cpath d='M25 60 L30 70 M75 60 L70 70' stroke='%23ffd700' stroke-width='2'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%23ffd700' stroke='%23daa520' stroke-width='1'/%3E%3C/svg%3E");
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}

/* 均衡战机技能激活时的发光效果 */
.player-plane-6.skill-active:not(.invulnerable) {
  animation: goldGlow 1s ease-in-out infinite alternate;
}

/* 均衡战机技能激活且被击中时的闪烁效果 */
.player-plane-6.skill-active.invulnerable {
  animation: blink 0.2s infinite;
}

/* 技能期间金色子弹 */
.player-bullet.gold-bullet {
  background: linear-gradient(to top, #daa520, #ffd700);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  border-radius: 2px;
}

@keyframes goldGlow {
  from {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
  to {
    box-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.6);
  }
}

/* 幻影战机临时图标 - 预留接口以便后期添加自定义外观设计 */
.player-plane-7 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L85 40 L80 50 L20 50 L15 40 Z' fill='%23660066' stroke='%23ff00ff' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%23660066' stroke='%23ff00ff' stroke-width='2'/%3E%3Ccircle cx='45' cy='40' r='3' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Ccircle cx='55' cy='40' r='3' fill='%23ffff00' stroke='%23ffcc00' stroke-width='1'/%3E%3Cpath d='M10 35 L20 25 M90 35 L80 25' stroke='%23ff00ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Cpath d='M25 65 L30 75 M75 65 L70 75' stroke='%23ff00ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%23ff00ff' stroke='%23660066' stroke-width='1'/%3E%3C/svg%3E");
}

/* 幻影战机第二架飞机（深蓝色版本） */
.player-plane-7-secondary {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L85 40 L80 50 L20 50 L15 40 Z' fill='%23000066' stroke='%230066ff' stroke-width='2'/%3E%3Cpath d='M30 50 L50 80 L70 50' fill='%23000066' stroke='%230066ff' stroke-width='2'/%3E%3Ccircle cx='45' cy='40' r='3' fill='%2300ccff' stroke='%230099ff' stroke-width='1'/%3E%3Ccircle cx='55' cy='40' r='3' fill='%2300ccff' stroke='%230099ff' stroke-width='1'/%3E%3Cpath d='M10 35 L20 25 M90 35 L80 25' stroke='%230066ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Cpath d='M25 65 L30 75 M75 65 L70 75' stroke='%230066ff' stroke-width='2' stroke-dasharray='5,3'/%3E%3Crect x='45' y='65' width='10' height='10' fill='%230066ff' stroke='%23000066' stroke-width='1'/%3E%3C/svg%3E");
}

/* 敌机 */
.enemy-plane {
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 5;
  /* 确保敌机始终可见 */
  opacity: 1;
  transform: translateZ(0);
  will-change: transform;
}

.enemy-1 {
  width: 50px;
  height: 50px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L10 40 L20 40 L50 60 L80 40 L90 40 Z' fill='%23ff4757' stroke='white' stroke-width='2'/%3E%3C/svg%3E");
}

.enemy-2 {
  width: 60px;
  height: 60px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L20 50 L30 40 L70 40 L80 50 Z' fill='%23ff6348' stroke='white' stroke-width='2'/%3E%3Ccircle cx='35' cy='60' r='5' fill='%23ff0000'/%3E%3Ccircle cx='65' cy='60' r='5' fill='%23ff0000'/%3E%3C/svg%3E");
}

.enemy-3 {
  width: 70px;
  height: 70px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='30' width='50' height='40' fill='%23ff3838' stroke='white' stroke-width='2'/%3E%3Cpath d='M50 20 L30 30 M50 20 L70 30' stroke='white' stroke-width='3'/%3E%3Cpath d='M30 70 L20 80 M50 70 L40 85 M70 70 L80 80' stroke='white' stroke-width='3'/%3E%3C/svg%3E");
}

/* 医疗支援小队 - 精英敌机 */
.enemy-4 {
  width: 90px;
  height: 90px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L30 60 L20 60 L50 30 L80 60 L70 60 Z' fill='%23ffffff' stroke='%2300ff00' stroke-width='3'/%3E%3Cpath d='M45 40 L55 40 M50 35 L50 45' stroke='%2300ff00' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%2300ff00' stroke-width='2' stroke-dasharray='5,3'/%3E%3Ccircle cx='35' cy='65' r='3' fill='%2300ff00'/%3E%3Ccircle cx='65' cy='65' r='3' fill='%2300ff00'/%3E%3C/svg%3E");
  animation: greenPulse 2s infinite alternate;
  border-radius: 50%; /* 确保容器也是圆形 */
  position: relative;
}

/* 为医疗支援小队添加额外的圆形光环 */
.enemy-4::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0) 70%);
  border: 1px solid rgba(0, 255, 0, 0.5);
  z-index: -1;
  pointer-events: none;
}

/* 先锋号 - 精英敌机 */
.enemy-5 {
  width: 100px;
  height: 80px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 80 L10 30 L30 40 L70 40 L90 30 Z' fill='%23e17055' stroke='%23ff7675' stroke-width='3'/%3E%3Cpath d='M50 20 L20 40 M50 20 L80 40' stroke='%23ff7675' stroke-width='3'/%3E%3Cpath d='M30 30 L20 20 M70 30 L80 20' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='40' cy='55' r='4' fill='%23ff0000'/%3E%3Ccircle cx='60' cy='55' r='4' fill='%23ff0000'/%3E%3Cpath d='M45 75 L50 85 L55 75' stroke='%23ff7675' stroke-width='3'/%3E%3C/svg%3E");
}

/* 战盾 - 精英敌机 */
.enemy-6 {
  width: 110px;
  height: 100px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,10 10,40 10,70 50,90 90,70 90,40' fill='%232d3436' stroke='%23636e72' stroke-width='3'/%3E%3Crect x='30' y='30' width='40' height='40' fill='%23636e72' stroke='%23b2bec3' stroke-width='2' rx='5'/%3E%3Ccircle cx='40' cy='50' r='3' fill='%23ffd700'/%3E%3Ccircle cx='60' cy='50' r='3' fill='%23ffd700'/%3E%3Cpath d='M35 25 L45 15 M55 15 L65 25' stroke='%23b2bec3' stroke-width='2'/%3E%3Cpath d='M25 45 L15 55 M85 55 L75 45' stroke='%23b2bec3' stroke-width='2'/%3E%3C/svg%3E");
}

/* 所有敌机的圆形护盾效果 - 使用绝对定位但不影响敌机布局 */
.enemy-plane {
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 5;
  opacity: 1;
  transform: translateZ(0);
  will-change: transform;
}

/* 为有护盾的敌机添加独立的护盾元素容器 */
.shield-active {
  /* 移除position: relative，避免影响布局 */
}

/* 使用独立的元素或调整伪元素的实现方式 */
.enemy-plane.shield-active::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  border-radius: 50%;
  border: 2px solid rgba(100, 149, 237, 0.8);
  background: radial-gradient(circle, rgba(100, 149, 237, 0.3) 0%, rgba(100, 149, 237, 0) 70%);
  animation: shieldPulse 2s infinite;
  z-index: 4; /* 低于敌机的z-index但在背景之上 */
  pointer-events: none; /* 确保不影响鼠标事件 */
}

.enemy-plane.shield-active::after {
  /* 清除之前的伪元素效果 */
  content: none;
}

@keyframes shieldPulse {
  0% {
    box-shadow: 0 0 10px rgba(100, 149, 237, 0.8), 0 0 20px rgba(100, 149, 237, 0.6);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 20px rgba(100, 149, 237, 1), 0 0 40px rgba(100, 149, 237, 0.8);
    opacity: 0.8;
  }
  100% {
    box-shadow: 0 0 10px rgba(100, 149, 237, 0.8), 0 0 20px rgba(100, 149, 237, 0.6);
    opacity: 1;
  }
}

/* 魔王号 - Boss敌机 */
.enemy-7 {
  width: 140px;
  height: 140px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 85 L25 50 L35 40 L65 40 L75 50 Z' fill='%236c5ce7' stroke='%23a29bfe' stroke-width='4'/%3E%3Cpath d='M50 25 L20 55 M50 25 L80 55' stroke='%23a29bfe' stroke-width='4'/%3E%3Cpath d='M35 25 L25 35 M65 25 L75 35' stroke='%2300d2d3' stroke-width='2'/%3E%3Ccircle cx='40' cy='55' r='5' fill='%23ff0000' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='60' cy='55' r='5' fill='%23ff0000' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='50' cy='80' r='8' fill='%236c5ce7' stroke='%23a29bfe' stroke-width='2'/%3E%3Cpath d='M45 65 L50 70 L55 65' stroke='%23a29bfe' stroke-width='3'/%3E%3C/svg%3E");
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  /* 不使用position: relative，避免影响游戏中的定位逻辑 */
}

/* 为魔王号应用正五边形辉光特效 - 使用独立的动画元素方式 */
.pentagon-glow-effect {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5 L25 30 L35 60 L65 60 L75 30 Z' fill='none' stroke='%236c5ce7' stroke-width='3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: pentagonGlow 3s infinite ease-in-out;
  pointer-events: none;
  position: absolute;
  z-index: 4; /* 低于敌机但高于背景 */
}

/* 为魔女号应用金色正六边形辉光特效 */
.hexagon-glow-effect {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L85 25 L85 75 L50 90 L15 75 L15 25 Z' fill='none' stroke='%23fdcb6e' stroke-width='3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: hexagonGlow 3s infinite ease-in-out;
  pointer-events: none;
  position: absolute;
  z-index: 4; /* 低于敌机但高于背景 */
}

/* 魔女号 - Boss敌机 */
.enemy-8 {
  width: 130px;
  height: 150px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 95 C30 75, 20 60, 30 40 C40 20, 60 20, 70 40 C80 60, 70 75, 50 95 Z' fill='%23fd79a8' stroke='%23fdcb6e' stroke-width='3'/%3E%3Cpath d='M30 40 C25 50, 25 60, 30 70 M70 40 C75 50, 75 60, 70 70' stroke='%23fdcb6e' stroke-width='2'/%3E%3Ccircle cx='45' cy='50' r='4' fill='%23ffffff' stroke='%23fdcb6e' stroke-width='1'/%3E%3Ccircle cx='55' cy='50' r='4' fill='%23ffffff' stroke='%23fdcb6e' stroke-width='1'/%3E%3Cpath d='M45 58 Q50 63, 55 58' fill='none' stroke='%23ffffff' stroke-width='2'/%3E%3Cpath d='M50 40 C45 30, 55 30, 50 40' fill='%236c5ce7' stroke='%23fdcb6e' stroke-width='2'/%3E%3Cpath d='M30 30 L25 20 M70 30 L75 20' stroke='%23fdcb6e' stroke-width='3'/%3E%3C/svg%3E");
}

/* 绿色圆形脉冲动画 */
@keyframes greenPulse {
  0% {
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.7), 0 0 30px rgba(0, 255, 0, 0.5), 0 0 45px rgba(0, 255, 0, 0.3);
    opacity: 1;
  }
  100% {
    box-shadow: 0 0 25px rgba(0, 255, 0, 1), 0 0 50px rgba(0, 255, 0, 0.8), 0 0 75px rgba(0, 255, 0, 0.6);
    opacity: 0.9;
  }
}

/* 医疗支援技能效果 - 应用于所有友军单位 */
.medical-support-active {
  /* 移除position: relative，避免影响布局 */
}

/* 使用与护盾效果相同的实现方式 */
.enemy-plane.medical-support-active::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 0, 0.8);
  background: radial-gradient(circle, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0) 70%);
  animation: healingAura 2s infinite;
  z-index: 4; /* 低于敌机的z-index但在背景之上 */
  pointer-events: none; /* 确保不影响鼠标事件 */
}

.enemy-plane.medical-support-active::after {
  /* 清除之前的伪元素效果 */
  content: none;
}

/* 医疗支援光环动画 - 与护盾动画风格统一 */
@keyframes healingAura {
  0% {
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.6);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 255, 0, 1), 0 0 40px rgba(0, 255, 0, 0.8);
    opacity: 0.8;
  }
  100% {
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.6);
    opacity: 1;
  }
}

/* 医疗支援小队和战盾特效已统一实现 */

/* Boss发光动画效果 */
@keyframes bossGlow {
  from {
    box-shadow: 0 0 20px rgba(108, 92, 231, 0.7);
  }
  to {
    box-shadow: 0 0 40px rgba(108, 92, 231, 1), 0 0 60px rgba(162, 155, 254, 0.6);
  }
}

/* 正五边形辉光特效 */
@keyframes pentagonGlow {
  0% {
    transform: scale(1);
    opacity: 0.7;
    filter: drop-shadow(0 0 15px rgba(108, 92, 231, 0.7));
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
    filter: drop-shadow(0 0 25px rgba(108, 92, 231, 1)) drop-shadow(0 0 40px rgba(162, 155, 254, 0.8));
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
    filter: drop-shadow(0 0 15px rgba(108, 92, 231, 0.7));
  }
}

/* 正六边形辉光特效 */
@keyframes hexagonGlow {
  0% {
    transform: scale(1);
    opacity: 0.7;
    filter: drop-shadow(0 0 15px rgba(253, 203, 110, 0.7));
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
    filter: drop-shadow(0 0 25px rgba(253, 203, 110, 1)) drop-shadow(0 0 40px rgba(253, 171, 96, 0.8));
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
    filter: drop-shadow(0 0 15px rgba(253, 203, 110, 0.7));
  }
}

/* 五边形辉光容器 */
.pentagon-glow-container {
  position: relative;
}

.pentagon-glow-container::after {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5 L90 35 L75 85 L25 85 L10 35 Z' fill='none' stroke='%236c5ce7' stroke-width='2'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: pentagonGlow 3s infinite ease-in-out;
  pointer-events: none;
  z-index: -1;
}

/* 子弹 */
.bullet {
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
}

.player-bullet {
  background: linear-gradient(to top, #00ffff, #00cec9);
  border-radius: 2px;
  z-index: 3;
  width: 4px;  /* 确保子弹有明确的宽度 */
  height: 15px; /* 确保子弹有明确的高度 */
}

.enemy-bullet {
  background: linear-gradient(to bottom, #ff6b6b, #ee5a24);
  border-radius: 3px;
  z-index: 3;
  width: 6px;  /* 确保子弹有明确的宽度 */
  height: 15px; /* 确保子弹有明确的高度 */
  box-shadow: 0 0 5px rgba(255, 107, 107, 0.7);
}

/* 战盾的高亮白色子弹 */
.enemy-bullet.shield-bullet {
  background: linear-gradient(to bottom, #ffffff, #e0e0e0);
  box-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7);
}

/* 先锋号的黑色红光子弹 */
.enemy-bullet.vanguard-bullet {
  background: linear-gradient(to bottom, #333333, #1a1a1a);
  box-shadow: 0 0 10px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 0.7);
  border: 1px solid rgba(255, 0, 0, 0.8);
}

/* 魔王号的黑色发紫光圆形子弹 */
.enemy-bullet.devil-bullet {
  background: radial-gradient(circle, #333333, #1a1a1a);
  box-shadow: 0 0 10px rgba(138, 43, 226, 1), 0 0 20px rgba(138, 43, 226, 0.7);
  border: 2px solid rgba(138, 43, 226, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 魔女号的粉色发金光圆形子弹 */
.enemy-bullet.witch-bullet {
  background: radial-gradient(circle, #ff69b4, #ff1493);
  box-shadow: 0 0 10px rgba(255, 215, 0, 1), 0 0 20px rgba(255, 215, 0, 0.7);
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 天女散花子弹 - 紫色金光圆形 */
.enemy-bullet.scatter-shot-bullet {
  background: radial-gradient(circle, #9370db, #6a5acd);
  box-shadow: 0 0 10px rgba(255, 215, 0, 1), 0 0 20px rgba(255, 215, 0, 0.7);
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 爆炸效果 */
.explosion {
  position: absolute;
  width: 80px;
  height: 80px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 20;
}

/* 幻影战机紫色爆炸效果 */
.explosion-stealth-0 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%239b59b6'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%239b59b6' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

.explosion-stealth-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23a29bfe'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23a29bfe' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

.explosion-stealth-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%2374b9ff'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2374b9ff' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

.explosion-stealth-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%2381ecec'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%2381ecec' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

/* 重装战机绿色爆炸效果 */
.explosion-armor-0 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%2300b894'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%2300b894' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

.explosion-armor-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%2355efc4'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%2355efc4' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

.explosion-armor-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%2374b9ff'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2374b9ff' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

.explosion-armor-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%2381ecec'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%2381ecec' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

/* 均衡战机金色爆炸效果 */
.explosion-balance-0 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%23daa520'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23daa520' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

.explosion-balance-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23ffd700'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23ffd700' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

.explosion-balance-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%23ffed4a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffed4a' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

.explosion-balance-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%23f39c12'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23f39c12' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

.explosion-0 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%23ff6b6b'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ff6b6b' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

.explosion-1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23ff7675'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23ff7675' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

.explosion-2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%23fdcb6e'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23fdcb6e' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

.explosion-3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%23fab1a0'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23fab1a0' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}
</style>