<template>
  <div class="enemy-test-container">
    <!-- 左侧按键说明区域 -->
    <div class="keyboard-guide">
      <h2>按键说明</h2>
      
      <div class="key-item">
        <span class="key">1-8</span>
        <span class="desc">生成敌机</span>
      </div>
      <div class="key-item">
        <span class="key">Z+1-8</span>
        <span class="desc">清除相应种类敌机</span>
      </div>
      <div class="key-item">
        <span class="key">R</span>
        <span class="desc">重置</span>
      </div>
      <div class="key-item">
        <span class="key">空格</span>
        <span class="desc">暂停/继续</span>
      </div>
      <div class="key-item">
        <span class="key">J</span>
        <span class="desc">伤害敌机</span>
      </div>
      <div class="key-item">
        <span class="key">K</span>
        <span class="desc">调血至50%</span>
      </div>
      <div class="key-item">
        <span class="key">L</span>
        <span class="desc">清除随机医疗小队战机</span>
      </div>
      
      <div v-if="isPaused" class="guide-pause-indicator">已暂停</div>
    </div>
    
    <!-- 中央测试画面区域 -->
    <div class="game-container">
      <h1>敌机测试页面</h1>
      <div class="game-area" ref="gameArea">
        <!-- 敌机 -->
    <div 
      v-for="(enemy, index) in enemies" 
      :key="`enemy-${index}`"
      class="enemy-plane"
      :class="[
        `enemy-${enemy.type}`, 
        { 'shield-active': enemy.hasShield },
        { 'medical-support-active': enemy.showHealingEffect }
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
        
        <!-- 敌机信息显示 -->
        <div 
          v-for="(enemy, index) in enemies" 
          :key="`enemy-info-${index}`"
          class="enemy-info"
          :style="{ left: (enemy.x + enemy.width/2) + 'px', top: (enemy.y - 60) + 'px' }"
        >
          血量: {{ enemy.health }}/{{ enemy.maxHealth }} | 移速: {{ enemy.speed }} | 伤害: {{ getFinalDamage(enemy) }}
          <span v-if="enemy.hasShield"> | 护盾: {{ enemy.shieldStrength }}</span>
          <span v-if="enemy.specialAbility === 'deathLaser' && enemy.isLaserWarning">
            {{ getSpecialAbilityName(enemy.specialAbility) }}: 警告中 ({{ calculateCooldown(enemy) }}s)
          </span>
          <span v-else-if="enemy.specialAbility">
            {{ getSpecialAbilityName(enemy.specialAbility) }}: {{ calculateCooldown(enemy) }}s
          </span>
          <span v-if="enemy.secondSpecialAbility">
            {{ getSpecialAbilityName(enemy.secondSpecialAbility) }}: {{ calculateCooldown(enemy, 'secondSpecialAbility') }}s
          </span>
          <span v-if="enemy.isBoss"> | Boss技能冷却: {{ calculateCooldown(enemy) }}s</span>
        </div>
        
        <!-- 激光警告线 -->
        <template 
          v-for="(enemy, enemyIndex) in enemies.filter(e => e.specialAbility === 'deathLaser' && e.isLaserWarning && e.laserPositions)"
          :key="`enemy-laser-${enemyIndex}`"
        >
          <div 
            v-for="(laserX, posIndex) in enemy.laserPositions" 
            :key="`laser-warning-${enemyIndex}-${posIndex}`"
            class="laser-warning"
            :style="{ left: laserX + 'px', width: enemy.laserWidth + 'px', height: gameHeight + 'px' }"
          ></div>
        </template>
        
        <!-- 敌机子弹 -->
        <div 
          v-for="(bullet, index) in enemyBullets" 
          :key="`enemy-bullet-${index}`"
          class="bullet enemy-bullet"
          :class="{ 'shield-bullet': bullet.isShieldBullet, 'vanguard-bullet': bullet.isVanguardBullet, 'devil-bullet': bullet.isDevilBullet, 'witch-bullet': bullet.isWitchBullet, 'scatter-shot-bullet': bullet.isScatterShotBullet }"
          :style="{ left: bullet.x + 'px', top: bullet.y + 'px' }"
        >
          <div class="bullet-damage">{{ bullet.damage }}</div>
        </div>
        
        <!-- 爆炸效果 -->
        <div v-for="(explosion, index) in explosions" :key="`explosion-${index}`"
          class="explosion"
          :class="explosion.balance ? `explosion-balance-${explosion.frame}` : explosion.stealth ? `explosion-stealth-${explosion.frame}` : explosion.armor ? `explosion-armor-${explosion.frame}` : `explosion-${explosion.frame}`"
          :style="{ left: explosion.x + 'px', top: explosion.y + 'px' }"
        ></div>
      </div>
    </div>
    
    <!-- 右侧敌机种类说明区域 -->
    <div class="enemy-types-guide">
      <h3>敌机类型</h3>
      <div class="enemy-type-vertical">
        <div class="enemy-type-display">
          <span class="type-number">1</span>
          <span class="type-name">普通战机</span>
        </div>
        <div class="enemy-type-display">
          <span class="type-number">2</span>
          <span class="type-name">干扰战机</span>
        </div>
        <div class="enemy-type-display">
          <span class="type-number">3</span>
          <span class="type-name">重型战机</span>
        </div>
        <div class="enemy-type-display elite">
          <span class="type-number">4</span>
          <span class="type-name">医疗支援小队（精英）</span>
        </div>
        <div class="enemy-type-display elite">
          <span class="type-number">5</span>
          <span class="type-name">先锋号（精英）</span>
        </div>
        <div class="enemy-type-display elite">
          <span class="type-number">6</span>
          <span class="type-name">战盾（精英）</span>
        </div>
        <div class="enemy-type-display boss">
          <span class="type-number">7</span>
          <span class="type-name">魔王号（Boss）</span>
        </div>
        <div class="enemy-type-display boss">
          <span class="type-number">8</span>
          <span class="type-name">魔女号（Boss）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const gameArea = ref(null)
const enemies = ref([])
const enemyBullets = ref([])
const explosions = ref([])
const gameWidth = ref(0)
const gameHeight = ref(0)
const isPaused = ref(false) // 游戏暂停状态
let gameLoopId = null
const keys = ref({}) // 记录按键状态
const isZKeyPressed = ref(false)

// 敌机数据配置
// 获取特殊能力名称
const getSpecialAbilityName = (ability) => {
  const names = {
    'healing': '医疗支援',
    'shield': '护盾防御',
    'deathLaser': '死亡射击',
    'scatterShot': '天女散花'
  }
  return names[ability] || ability
}

// 计算冷却时间
const calculateCooldown = (enemy, abilityType = 'specialAbility') => {
  let cooldown = 0
  const now = Date.now()
  
  // 确定要检查的能力类型和相关属性
  const ability = abilityType === 'specialAbility' ? enemy.specialAbility : enemy.secondSpecialAbility
  
  if (ability === 'healing' && enemy.lastHealTime) {
    const elapsed = now - enemy.lastHealTime
    const healingRate = enemy.healingRate || 3000
    cooldown = Math.max(0, (healingRate - elapsed) / 1000)
  } else if (ability === 'shield' && enemy.lastShieldTime) {
    const elapsed = now - enemy.lastShieldTime
    const shieldRate = enemy.shieldRate || 8000
    cooldown = Math.max(0, (shieldRate - elapsed) / 1000)
  } else if (ability === 'scatterShot' && enemy.lastScatterShotTime) {
    const elapsed = now - enemy.lastScatterShotTime
    const scatterShotRate = enemy.scatterShotRate || 8000
    cooldown = Math.max(0, (scatterShotRate - elapsed) / 1000)
  } else if (ability === 'deathLaser' && enemy.lastLaserTime) {
    if (enemy.isLaserWarning) {
      // 显示警告剩余时间
      cooldown = Math.max(0, (enemy.laserWarningEndTime - now) / 1000)
    } else {
      // 显示技能冷却时间
      const elapsed = now - enemy.lastLaserTime
      const laserRate = enemy.laserRate || 10000
      cooldown = Math.max(0, (laserRate - elapsed) / 1000)
    }
  } else if (enemy.isBoss && enemy.lastExplosionTime) {
    const elapsed = now - enemy.lastExplosionTime
    const explosionRate = enemy.explosionRate || 5000
    cooldown = Math.max(0, (explosionRate - elapsed) / 1000)
  }
  
  return cooldown.toFixed(1)
}

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
    laserDamage: 0, // 现在激光使用一击必杀效果，不再需要具体伤害值
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
    fireRate: 500,
    damage: 3,
    score: 10,
    movementPattern: 'horizontalVertical',
    bulletsPerAttack: 1,
    bulletPattern: 'fullCircle',
    damageBoost: 2,
    specialAbility: 'deathLaser',
    laserRate: 8000,
    laserDamage: 20,
    laserWarningTime: 4000,
    laserWidth: 30,
    lastLaserTime: Date.now(),
    isLaserWarning: false,
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
    scatterShotBulletSpeed: 10, // 子弹速度10m/s
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

// 生成敌机
const spawnEnemy = (type) => {
  if (!enemyConfigs[type]) return
  
  const config = enemyConfigs[type]
  
  if (type === 4) {
    // 医疗支援小队特殊处理：1单位生成3个敌机
    // 计算生成3个敌机的位置，形成一个小队
    const centerX = Math.random() * (gameWidth.value - config.width)
    const targetY = Math.random() * (gameHeight.value * 0.5 - config.height)
    
    // 生成3个医疗支援小队成员
    for (let i = 0; i < 3; i++) {
      // 克隆配置对象
      const enemy = { ...config }
      // 确保每个敌机都有独立的随机值
      enemy.directionX = Math.random() > 0.5 ? 1 : -1
      enemy.directionY = Math.random() > 0.5 ? 1 : -1
      
      // 设置略微不同的位置，形成小队阵型
      enemy.x = centerX + (i % 3 - 1) * 50 // 左右偏移
      
      // 添加生成动画相关属性
      enemy.isSpawning = true // 标记正在生成动画中
      enemy.spawnStartY = -enemy.height // 生成起始位置（屏幕上方）
      enemy.spawnTargetY = targetY + Math.floor(i / 3) * 30 // 目标位置
      enemy.y = enemy.spawnStartY // 初始位置
      
      // 确保在屏幕范围内
      enemy.x = Math.max(0, Math.min(enemy.x, gameWidth.value - enemy.width))
      
      enemy.maxHealth = config.health
      enemy.lastFireTime = Date.now()
      enemy.type = type
      enemy.spawnStartTime = Date.now() // 记录生成开始时间
      
      // 为特殊能力初始化时间
      if (enemy.specialAbility === 'healing') {
        enemy.lastHealTime = Date.now()
      }
      
      enemies.value.push(enemy)
      console.log(`生成了医疗支援小队成员, 当前数量: ${enemies.value.length}`)
    }
  } else {
    // 其他类型敌机生成逻辑
    // 克隆配置对象
    const enemy = { ...config }
    // 确保每个敌机都有独立的随机值
    enemy.directionX = Math.random() > 0.5 ? 1 : -1
    enemy.directionY = Math.random() > 0.5 ? 1 : -1
    
    // 在屏幕上半部分随机生成
    enemy.x = Math.random() * (gameWidth.value - enemy.width)
    
    // 添加生成动画相关属性
    enemy.isSpawning = true // 标记正在生成动画中
    enemy.spawnStartY = -enemy.height // 生成起始位置（屏幕上方）
    enemy.spawnTargetY = Math.random() * (gameHeight.value * 0.5 - enemy.height) // 目标位置
    enemy.y = enemy.spawnStartY // 初始位置
    
    enemy.maxHealth = config.health
    enemy.lastFireTime = Date.now()
      enemy.type = type
      enemy.spawnStartTime = Date.now() // 记录生成开始时间
    
    // 为特殊能力初始化时间
    if (enemy.specialAbility === 'healing') {
      enemy.lastHealTime = Date.now()
    }
    if (enemy.specialAbility === 'shield') {
      enemy.lastShieldTime = Date.now()
      enemy.hasShield = false
    }
    if (enemy.specialAbility === 'deathLaser') {
      enemy.lastLaserTime = Date.now()
      enemy.isLaserWarning = false
    }
    if (enemy.isBoss) {
      if (enemy.specialAttack) {
        enemy.lastSpecialAttackTime = Date.now()
        enemy.isSpecialAttacking = false
      }
    }
    
    enemies.value.push(enemy)
    console.log(`生成了敌机类型: ${type}, 当前数量: ${enemies.value.length}`)
  }
}

// 更新敌机移动
const updateEnemyMovement = (enemy) => {
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
      if (enemy.y <= 0 || enemy.y + enemy.height >= gameHeight.value) {
        enemy.directionY *= -1
      }
      break
  }
}

// 处理特殊能力
const handleSpecialAbilities = (enemy, now) => {
  // 处理第二个特殊能力（如果存在）
  if (enemy.secondSpecialAbility === 'shield') {
    // 定期生成护盾
    if (!enemy.hasShield && now - enemy.lastShieldTime > enemy.shieldRate) {
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
    // 恢复场上所有敌机的生命值
    enemies.value.forEach(ally => {
      if (ally.health < ally.maxHealth) {
        ally.health = Math.min(ally.health + enemy.healingAmount, ally.maxHealth)
        // 添加治疗效果动画（可以在UI中显示绿色的治疗数字）
        // 为所有友军添加绿色特效
        ally.showHealingEffect = true
      }
    })
    // 更新所有医疗支援小队的治疗时间，确保同步
    enemies.value.forEach(medic => {
      if (medic.type === 4 && medic.specialAbility === 'healing') {
        medic.lastHealTime = now
      }
    })
    
    console.log('医疗支援小队发动治疗：恢复所有敌机3点生命值')
    
    // 2秒后移除治疗效果
    setTimeout(() => {
      enemies.value.forEach(ally => {
        ally.showHealingEffect = false
      })
    }, 2000)
  }
  
  // 战盾护盾 - 守护技能：为所有队友提供护盾
  if (enemy.specialAbility === 'shield') {
    // 定期生成护盾
    if (!enemy.hasShield && now - enemy.lastShieldTime > enemy.shieldRate) {
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
      console.log('先锋号准备发射死亡激光，位置:', enemy.laserPositions)
    }
    
    // 检查激光警告是否结束，发射激光
    if (enemy.isLaserWarning && now >= enemy.laserWarningEndTime) {
      // 发射3条激光
      console.log('先锋号发射死亡激光！')
      
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
      
      // 重置激光状态
      enemy.isLaserWarning = false
      enemy.lastLaserTime = now
      enemy.laserPositions = null
    }
  }
  
  // Boss敌机特殊能力
  if (enemy.isBoss) {
    // 特殊攻击
    if (enemy.specialAttack) {
      if (!enemy.isSpecialAttacking && now - enemy.lastSpecialAttackTime > enemy.specialAttack.interval) {
        enemy.isSpecialAttacking = true
        enemy.specialAttackEndTime = now + enemy.specialAttack.duration
      }
      
      if (enemy.isSpecialAttacking) {
        if (now > enemy.specialAttackEndTime) {
          enemy.isSpecialAttacking = false
          enemy.lastSpecialAttackTime = now
        } else {
          // 在特殊攻击期间发射大量子弹
          if (now - (enemy.lastSpecialFireTime || 0) > 100) {
            for (let i = 0; i < 5; i++) {
              const angle = (i / 5) * Math.PI * 2
              enemyBullets.value.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height / 2 - 3,
                width: 6,
                height: 6,
                speedX: Math.sin(angle) * 4,
                speedY: Math.cos(angle) * 4,
                damage: enemy.specialAttack.bulletDamage
              })
            }
            enemy.lastSpecialFireTime = now
          }
        }
      }
    }
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
    // 只保留使用的弹道模式
    case 'fullCircle':
      // 全方位弹幕攻击模式，30度间隔，覆盖0-360度
      for (let angle = 0; angle < 360; angle += 30) {
        const angleRad = (angle * Math.PI) / 180;
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
          speedX: Math.sin(angle) * 10, // 增加水平速度分量
          speedY: 10, // 增加垂直速度，使子弹更快下落
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
          speedX: Math.sin(angleRad) * 10,
          speedY: Math.cos(angleRad) * 10,
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
          speedX: Math.sin(angleRad) * 10,
          speedY: Math.cos(angleRad) * 10,
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
          speedX: Math.sin(angleRad) * 10,
          speedY: Math.cos(angleRad) * 10,
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
}

// 更新敌机
const updateEnemies = () => {
  const now = Date.now()
  
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
  
  const damageBoost = calculateDamageBoost()
  
  enemies.value = enemies.value.filter(enemy => {
    // 应用伤害增益
    const effectiveDamage = enemy.damage + damageBoost
    
    // 实现敌机移动模式
    updateEnemyMovement(enemy)
    
    // 实现特殊能力
    handleSpecialAbilities(enemy, now)
    
    // 实现敌机开火
    if (enemy.fireRate > 0 && now - enemy.lastFireTime > enemy.fireRate) {
      fireEnemyBullets(enemy, effectiveDamage, now)
    }
    
    // 只保留在屏幕内且生命值大于0的敌机
    return enemy.health > 0 && 
           enemy.x > -enemy.width && enemy.x < gameWidth.value && 
           enemy.y > -enemy.height && enemy.y < gameHeight.value
  })
}

// 获取敌机最终伤害（包括所有增益和加成）
const getFinalDamage = (enemy) => {
  // 基础伤害加上团队伤害增益
  let baseDamage = enemy.damage
  let damageBoost = 0
  
  // 计算团队伤害增益
  enemies.value.forEach(e => {
    if (e.damageBoost) {
      damageBoost += e.damageBoost
    }
  })
  
  let effectiveDamage = baseDamage + damageBoost
  
  // 计算战盾和拥有护盾技能的魔女号的数量，每有一个就增加1点伤害（可叠加）
  const shieldSupportCount = enemies.value.filter(e => 
    (e.type === 6 && e.health > 0) || 
    (e.type === 8 && e.health > 0 && e.secondSpecialAbility === 'shield')
  ).length
  effectiveDamage += shieldSupportCount
  
  return effectiveDamage
}

// 更新子弹
const updateBullets = () => {
  // 更新敌机子弹
  enemyBullets.value = enemyBullets.value.filter(bullet => {
    if (bullet.speedX !== undefined && bullet.speedY !== undefined) {
      bullet.x += bullet.speedX
      bullet.y += bullet.speedY
    } else if (bullet.speed) {
      bullet.y += bullet.speed
    }
    
    // 只保留在屏幕内的子弹
    return bullet.x > -bullet.width && bullet.x < gameWidth.value && 
           bullet.y > -bullet.height && bullet.y < gameHeight.value
  })
}

const updateExplosions = () => {
  const now = Date.now()
  explosions.value = explosions.value.filter(explosion => {
    // 处理激光效果
    if (explosion.isLaser) {
      // 激光效果持续时间
      if (!explosion.startTime) {
        explosion.startTime = now
      }
      const elapsed = now - explosion.startTime
      // 激光持续0.5秒
      if (elapsed > 500) {
        return false
      }
      
      // 在测试环境中模拟激光对玩家的伤害
      console.log('激光伤害区域:', explosion.x, explosion.y, explosion.width, explosion.height)
      return true
    }
    // 处理普通爆炸动画
    else if (!explosion.isShieldBreak && !explosion.isExplosion) {
      explosion.timer += 16.67 // 假设60fps
      if (explosion.timer > 100) {
        explosion.frame++
        explosion.timer = 0
      }
      return explosion.frame < 4 // 4帧爆炸动画
    } else if (explosion.isShieldBreak) {
      explosion.timer += 16.67
      if (explosion.timer > 50) {
        explosion.frame++
        explosion.timer = 0
      }
      return explosion.frame < 3 // 3帧护盾破碎动画
    } else if (explosion.isExplosion) {
      // 处理持续爆炸伤害效果
      if (!explosion.startTime) {
        explosion.startTime = now
      }
      const elapsed = now - explosion.startTime
      // 持续1秒的爆炸效果
      if (elapsed > 1000) {
        return false
      }
      
      // 定期造成伤害
      if (!explosion.lastDamageTime || now - explosion.lastDamageTime > 100) {
        explosion.lastDamageTime = now
      }
      
      return true
    }
    return true
  })
}

// 游戏循环
const gameLoop = () => {
  if (!isPaused.value) {
    updateEnemies()
    updateBullets()
    updateExplosions()
  }
  
  gameLoopId = requestAnimationFrame(gameLoop)
}

// 处理键盘按键
const handleKeyDown = (event) => {
  keys.value[event.key] = true
  
  // 跟踪z键是否被按下
  if (event.key === 'z' || event.key === 'Z') {
    isZKeyPressed.value = true
  }
  
  // 数字键1-8生成敌机或清除敌机
  if (event.key >= '1' && event.key <= '8') {
    const enemyType = parseInt(event.key)
    if (isZKeyPressed.value) {
      // 按下z键时，清除场上所有对应类型的敌机
      const initialCount = enemies.value.length
      enemies.value = enemies.value.filter(enemy => enemy.type !== enemyType)
      const removedCount = initialCount - enemies.value.length
      console.log(`已清除所有类型${enemyType}的敌机，共清除${removedCount}架`)
    } else {
      // 正常生成敌机
      spawnEnemy(enemyType)
    }
  }
  
  // R键重置
  if (event.key === 'r' || event.key === 'R') {
    resetTest()
  }
  
  // 空格键暂停/继续
  if (event.key === ' ') {
    event.preventDefault() // 防止页面滚动
    isPaused.value = !isPaused.value
    console.log(isPaused.value ? '游戏已暂停' : '游戏继续')
  }
  
  // K键将所有敌机血量调整为最大值的50%
  if (event.key === 'k' || event.key === 'K') {
    enemies.value.forEach(enemy => {
      enemy.health = Math.max(0, Math.floor(enemy.maxHealth * 0.5))
      console.log(`敌机血量已调整为最大值的50%，当前血量: ${enemy.health}/${enemy.maxHealth}`)
    })
    console.log(`已将所有敌机血量调整为最大值的50%，敌机数量: ${enemies.value.length}`)
  }
  
  // L键随机清除一单位医疗支援小队的其中一辆战机
  if (event.key === 'l' || event.key === 'L') {
    const medicalSquadEnemies = enemies.value.filter(enemy => enemy.type === 4)
    
    if (medicalSquadEnemies.length > 0) {
      // 随机选择一辆医疗小队战机
      const randomIndex = Math.floor(Math.random() * medicalSquadEnemies.length)
      const targetEnemy = medicalSquadEnemies[randomIndex]
      
      // 记录被清除的敌机信息
      const originalHealth = targetEnemy.health
      
      // 清除该战机（将生命值设为0）
      targetEnemy.health = 0
      
      console.log(`已清除一辆医疗支援小队战机，原血量: ${originalHealth}/${targetEnemy.maxHealth}`)
    } else {
      console.log('场上没有医疗支援小队战机')
    }
  }
  
  // J键使所有敌机受到1点伤害
  if (event.key === 'j' || event.key === 'J') {
    const damage = 1
    enemies.value.forEach(enemy => {
      // 处理护盾效果
      if (enemy.hasShield && enemy.shieldStrength > 0) {
        // 护盾吸收伤害
        enemy.shieldStrength -= damage
        console.log(`敌机护盾吸收了${damage}点伤害，剩余护盾强度: ${Math.max(0, enemy.shieldStrength)}`)
        
        if (enemy.shieldStrength <= 0) {
          enemy.hasShield = false
          enemy.shieldStrength = 0
          console.log('敌机护盾被打破！')
          // 添加护盾破碎效果
          explosions.value.push({
            x: enemy.x,
            y: enemy.y,
            frame: 0,
            timer: 0,
            isShieldBreak: true
          })
        }
      } else {
        // 直接对生命值造成伤害
        enemy.health = Math.max(0, enemy.health - damage)
        console.log(`敌机受到${damage}点伤害，当前血量: ${enemy.health}/${enemy.maxHealth}`)
        
        // 检查敌机是否被消灭
        if (enemy.health <= 0) {
          console.log('敌机被消灭')
          // 这里可以添加敌机被消灭时的逻辑，比如爆炸效果等
        }
      }
    })
    console.log(`已对所有敌机造成${damage}点伤害，敌机数量: ${enemies.value.length}`)
  }
}

const handleKeyUp = (event) => {
  keys.value[event.key] = false
  
  // 跟踪z键释放
  if (event.key === 'z' || event.key === 'Z') {
    isZKeyPressed.value = false
  }
}

// 重置测试
const resetTest = () => {
  enemies.value = []
  enemyBullets.value = []
  explosions.value = []
  console.log('测试已重置')
}

// 设置游戏区域尺寸
const setGameDimensions = () => {
  if (gameArea.value) {
    gameWidth.value = gameArea.value.clientWidth
    gameHeight.value = gameArea.value.clientHeight
  }
}

onMounted(() => {
  nextTick(() => {
    setGameDimensions()
    window.addEventListener('resize', setGameDimensions)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    gameLoop()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', setGameDimensions)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId)
  }
})
</script>

<style scoped>
.enemy-test-container {
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: #000;
  color: #fff;
  font-family: Arial, sans-serif;
  overflow: hidden;
}

/* 左侧按键说明样式 */
.keyboard-guide {
  width: 180px;
  height: 100vh;
  background-color: #1a1a1a;
  padding: 12px;
  overflow-y: auto;
  border-right: 1px solid #333;
  box-sizing: border-box;
}

/* 右侧敌机种类说明样式 */
.enemy-types-guide {
  width: 200px;
  height: 100vh;
  background-color: #1a1a1a;
  padding: 12px;
  overflow-y: auto;
  border-left: 1px solid #333;
  box-sizing: border-box;
}

.keyboard-guide h2 {
  color: #00ffcc;
  margin-bottom: 12px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
}

.key-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding: 4px 0;
  border-bottom: 1px solid #333;
}

.key-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.key {
  background-color: #6633cc;
  color: #00ffcc;
  padding: 3px 8px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  margin-right: 8px;
  border: 1px solid #444;
  font-size: 12px;
}

.desc {
  color: #ddd;
  font-size: 12px;
  flex: 1;
  white-space: normal;
  word-wrap: break-word;
}

/* 右侧游戏区域样式 */
.game-container {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  background-color: #000;
}

.game-container h1 {
  color: #00ff00;
  margin-bottom: 20px;
  font-size: 24px;
  text-align: center;
}

.enemy-types-guide h3 {
  color: #00ffcc;
  margin-bottom: 10px;
  text-align: center;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.enemy-type-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-type-display {
  display: flex;
  align-items: center;
  background-color: #252525;
  padding: 8px;
  border-radius: 6px;
  border-left: 3px solid #0066cc;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.enemy-type-display:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 102, 204, 0.3);
}

.enemy-type-display.elite {
  border-left-color: #9900cc;
  background-color: #1a002d;
}

.enemy-type-display.elite:hover {
  box-shadow: 0 2px 4px rgba(153, 0, 204, 0.3);
}

.enemy-type-display.boss {
  border-left-color: #ff6600;
  background-color: #2d1a00;
}

.enemy-type-display.boss:hover {
  box-shadow: 0 2px 4px rgba(255, 102, 0, 0.3);
}

.type-number {
  background-color: #0066cc;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.enemy-type-display.elite .type-number {
  background-color: #9900cc;
}

.enemy-type-display.boss .type-number {
  background-color: #ff6600;
}

.type-name {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .enemy-types-guide {
    width: 180px;
  }
  
  .type-name {
    font-size: 12px;
  }
}

/* 暂停指示器 */
.pause-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: #ff0;
  text-shadow: 0 0 20px #ff0;
  z-index: 1000;
  animation: blink 1s infinite;
}

.guide-pause-indicator {
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  margin-top: 20px;
  font-weight: bold;
  border: 2px solid red;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

/* 滚动条样式 */
.keyboard-guide::-webkit-scrollbar {
  width: 8px;
}

.keyboard-guide::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.keyboard-guide::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.keyboard-guide::-webkit-scrollbar-thumb:hover {
  background: #777;
}

.game-area {
  width: 80%;
  height: 60vh;
  background-color: #111;
  border: 2px solid #00ff00;
  position: relative;
  overflow: hidden;
}

/* 导入敌机和子弹的样式 */
:deep(.enemy-plane) {
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

:deep(.enemy-1) {
  width: 50px;
  height: 50px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L10 40 L20 40 L50 60 L80 40 L90 40 Z' fill='%23ff4757' stroke='white' stroke-width='2'/%3E%3C/svg%3E");
}

:deep(.enemy-2) {
  width: 60px;
  height: 60px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L20 50 L30 40 L70 40 L80 50 Z' fill='%23ff6348' stroke='white' stroke-width='2'/%3E%3Ccircle cx='35' cy='60' r='5' fill='%23ff0000'/%3E%3Ccircle cx='65' cy='60' r='5' fill='%23ff0000'/%3E%3C/svg%3E");
}

:deep(.enemy-3) {
  width: 70px;
  height: 70px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='30' width='50' height='40' fill='%23ff3838' stroke='white' stroke-width='2'/%3E%3Cpath d='M50 20 L30 30 M50 20 L70 30' stroke='white' stroke-width='3'/%3E%3Cpath d='M30 70 L20 80 M50 70 L40 85 M70 70 L80 80' stroke='white' stroke-width='3'/%3E%3C/svg%3E");
}

/* 医疗支援小队 - 精英敌机 */
:deep(.enemy-4) {
  width: 90px;
  height: 90px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 90 L30 60 L20 60 L50 30 L80 60 L70 60 Z' fill='%23ffffff' stroke='%2300ff00' stroke-width='3'/%3E%3Cpath d='M45 40 L55 40 M50 35 L50 45' stroke='%2300ff00' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%2300ff00' stroke-width='2' stroke-dasharray='5,3'/%3E%3Ccircle cx='35' cy='65' r='3' fill='%2300ff00'/%3E%3Ccircle cx='65' cy='65' r='3' fill='%2300ff00'/%3E%3C/svg%3E");
  animation: greenPulse 2s infinite alternate;
  border-radius: 50%; /* 确保容器也是圆形 */
  position: relative;
}

/* 为医疗支援小队添加额外的圆形光环 */
:deep(.enemy-4::after) {
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
:deep(.medical-support-active) {
  position: relative;
  animation: scalePulse 1s ease-in-out infinite alternate;
}

:deep(.medical-support-active::before) {
  content: '';
  position: absolute;
  top: -30%;
  left: -30%;
  width: 160%;
  height: 160%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 0, 0.6) 0%, rgba(0, 255, 0, 0.3) 50%, rgba(0, 255, 0, 0) 80%);
  border: 2px solid rgba(0, 255, 0, 0.8);
  animation: healingAura 1s infinite;
  z-index: 4;
  pointer-events: none;
}

/* 医疗支援光环动画 */
@keyframes healingAura {
  0% {
    transform: scale(1);
    opacity: 0.6;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.7), 0 0 40px rgba(0, 255, 0, 0.5);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
    box-shadow: 0 0 30px rgba(0, 255, 0, 0.9), 0 0 60px rgba(0, 255, 0, 0.7), 0 0 90px rgba(0, 255, 0, 0.5);
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.7), 0 0 40px rgba(0, 255, 0, 0.5);
  }
}

/* 缩放脉冲动画 */
@keyframes scalePulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.05);
  }
}

/* 先锋号 - 精英敌机 */
:deep(.enemy-5) {
  width: 100px;
  height: 80px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 80 L10 30 L30 40 L70 40 L90 30 Z' fill='%23e17055' stroke='%23ff7675' stroke-width='3'/%3E%3Cpath d='M50 20 L20 40 M50 20 L80 40' stroke='%23ff7675' stroke-width='3'/%3E%3Cpath d='M30 30 L20 20 M70 30 L80 20' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='40' cy='55' r='4' fill='%23ff0000'/%3E%3Ccircle cx='60' cy='55' r='4' fill='%23ff0000'/%3E%3Cpath d='M45 75 L50 85 L55 75' stroke='%23ff7675' stroke-width='3'/%3E%3C/svg%3E");
}

/* 战盾 - 精英敌机 */
:deep(.enemy-6) {
  width: 110px;
  height: 100px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,10 10,40 10,70 50,90 90,70 90,40' fill='%232d3436' stroke='%23636e72' stroke-width='3'/%3E%3Crect x='30' y='30' width='40' height='40' fill='%23636e72' stroke='%23b2bec3' stroke-width='2' rx='5'/%3E%3Ccircle cx='40' cy='50' r='3' fill='%23ffd700'/%3E%3Ccircle cx='60' cy='50' r='3' fill='%23ffd700'/%3E%3Cpath d='M35 25 L45 15 M55 15 L65 25' stroke='%23b2bec3' stroke-width='2'/%3E%3Cpath d='M25 45 L15 55 M85 55 L75 45' stroke='%23b2bec3' stroke-width='2'/%3E%3C/svg%3E");
}

/* 所有敌机的圆形护盾效果 - 使用绝对定位但不影响敌机布局 */
:deep(.enemy-plane) {
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
:deep(.shield-active) {
  /* 移除position: relative，避免影响布局 */
}

/* 使用独立的元素或调整伪元素的实现方式 */
:deep(.enemy-plane.shield-active::before) {
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

:deep(.enemy-plane.shield-active::after) {
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
:deep(.enemy-7) {
  width: 140px;
  height: 140px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 85 L25 50 L35 40 L65 40 L75 50 Z' fill='%236c5ce7' stroke='%23a29bfe' stroke-width='4'/%3E%3Cpath d='M50 25 L20 55 M50 25 L80 55' stroke='%23a29bfe' stroke-width='4'/%3E%3Cpath d='M35 25 L25 35 M65 25 L75 35' stroke='%2300d2d3' stroke-width='2'/%3E%3Ccircle cx='40' cy='55' r='5' fill='%23ff0000' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='60' cy='55' r='5' fill='%23ff0000' stroke='%23ff7675' stroke-width='2'/%3E%3Ccircle cx='50' cy='80' r='8' fill='%236c5ce7' stroke='%23a29bfe' stroke-width='2'/%3E%3Cpath d='M45 65 L50 70 L55 65' stroke='%23a29bfe' stroke-width='3'/%3E%3C/svg%3E");
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
}

/* 正五边形辉光效果样式 */
.pentagon-glow-effect {
  position: absolute;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5 L25 30 L35 60 L65 60 L75 30 Z' fill='none' stroke='%236c5ce7' stroke-width='3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: pentagonGlow 3s infinite alternate;
  pointer-events: none;
  z-index: 4;
}

/* 正六边形辉光效果样式 */
.hexagon-glow-effect {
  position: absolute;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L85 25 L85 75 L50 90 L15 75 L15 25 Z' fill='none' stroke='%23fdcb6e' stroke-width='3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: hexagonGlow 3s infinite alternate;
  pointer-events: none;
  z-index: 4;
}
/* 魔女号 - Boss敌机 */
:deep(.enemy-8) {
  width: 130px;
  height: 150px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 95 C30 75, 20 60, 30 40 C40 20, 60 20, 70 40 C80 60, 70 75, 50 95 Z' fill='%23fd79a8' stroke='%23fdcb6e' stroke-width='3'/%3E%3Cpath d='M30 40 C25 50, 25 60, 30 70 M70 40 C75 50, 75 60, 70 70' stroke='%23fdcb6e' stroke-width='2'/%3E%3Ccircle cx='45' cy='50' r='4' fill='%23ffffff' stroke='%23fdcb6e' stroke-width='1'/%3E%3Ccircle cx='55' cy='50' r='4' fill='%23ffffff' stroke='%23fdcb6e' stroke-width='1'/%3E%3Cpath d='M45 58 Q50 63, 55 58' fill='none' stroke='%23ffffff' stroke-width='2'/%3E%3Cpath d='M50 40 C45 30, 55 30, 50 40' fill='%236c5ce7' stroke='%23fdcb6e' stroke-width='2'/%3E%3Cpath d='M30 30 L25 20 M70 30 L75 20' stroke='%23fdcb6e' stroke-width='3'/%3E%3C/svg%3E");
}

:deep(.bullet) {
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
}

.enemy-info {
  position: absolute;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #00ff00;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  border: 1px solid #00ff00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

:deep(.enemy-bullet) {
  background: linear-gradient(to bottom, #ff6b6b, #ee5a24);
  border-radius: 3px;
  z-index: 3;
  width: 6px;  /* 确保子弹有明确的宽度 */
  height: 15px; /* 确保子弹有明确的高度 */
  box-shadow: 0 0 5px rgba(255, 107, 107, 0.7);
}

/* 战盾的高亮白色子弹 */
:deep(.enemy-bullet.shield-bullet) {
  background: linear-gradient(to bottom, #ffffff, #e0e0e0);
  box-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7);
}

/* 先锋号的黑色红光子弹 */
:deep(.enemy-bullet.vanguard-bullet) {
  background: linear-gradient(to bottom, #333333, #1a1a1a);
  box-shadow: 0 0 10px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 0.7);
  border: 1px solid rgba(255, 0, 0, 0.8);
}

/* 魔王号的黑色发紫光圆形子弹 */
:deep(.enemy-bullet.devil-bullet) {
  background: radial-gradient(circle, #333333, #1a1a1a);
  box-shadow: 0 0 10px rgba(138, 43, 226, 1), 0 0 20px rgba(138, 43, 226, 0.7);
  border: 2px solid rgba(138, 43, 226, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 魔女号的粉色发金光圆形子弹 */
:deep(.enemy-bullet.witch-bullet) {
  background: radial-gradient(circle, #ff69b4, #ff1493);
  box-shadow: 0 0 10px rgba(255, 215, 0, 1), 0 0 20px rgba(255, 215, 0, 0.7);
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 天女散花子弹 - 紫色金光圆形 */
:deep(.enemy-bullet.scatter-shot-bullet) {
  background: radial-gradient(circle, #9370db, #6a5acd);
  box-shadow: 0 0 10px rgba(255, 215, 0, 1), 0 0 20px rgba(255, 215, 0, 0.7);
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  width: 20px;  /* 设置相同的宽度和高度，确保是正圆形 */
  height: 20px; /* 设置相同的宽度和高度，确保是正圆形 */
}

/* 爆炸效果 */
:deep(.explosion) {
  position: absolute;
  width: 80px;
  height: 80px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 20;
}

/* 幻影战机紫色爆炸效果 */
:deep(.explosion-stealth-0) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%239b59b6'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%239b59b6' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

:deep(.explosion-stealth-1) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23a29bfe'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23a29bfe' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

:deep(.explosion-stealth-2) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%2374b9ff'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2374b9ff' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

:deep(.explosion-stealth-3) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%2381ecec'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%2381ecec' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

/* 重装战机绿色爆炸效果 */
:deep(.explosion-armor-0) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%2300b894'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%2300b894' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

:deep(.explosion-armor-1) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%2355efc4'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%2355efc4' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

:deep(.explosion-armor-2) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%2374b9ff'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2374b9ff' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

:deep(.explosion-armor-3) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%2381ecec'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%2381ecec' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

/* 均衡战机金色爆炸效果 */
:deep(.explosion-balance-0) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%23daa520'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23daa520' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

:deep(.explosion-balance-1) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23ffd700'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23ffd700' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

:deep(.explosion-balance-2) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%23ffed4a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffed4a' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

:deep(.explosion-balance-3) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%23f39c12'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23f39c12' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

:deep(.explosion-0) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='%23ff6b6b'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ff6b6b' stroke-width='2' opacity='0.8'/%3E%3C/svg%3E");
}

:deep(.explosion-1) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='15' fill='%23ff7675'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23ff7675' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E");
}

:deep(.explosion-2) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='20' fill='%23fdcb6e'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23fdcb6e' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
}

:deep(.explosion-3) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='%23fab1a0'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23fab1a0' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E");
}

@keyframes pulse {
  from {
    box-shadow: 0 0 10px rgba(0, 210, 211, 0.6);
  }
  to {
    box-shadow: 0 0 20px rgba(0, 210, 211, 1);
  }
}

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

/* 激光样式 */
.laser-warning {
  position: absolute;
  background: rgba(255, 0, 0, 0.3);
  z-index: 5;
  animation: laserWarningPulse 0.5s infinite alternate;
}

@keyframes laserWarningPulse {
  from {
    opacity: 0.2;
    background: rgba(255, 0, 0, 0.3);
  }
  to {
    opacity: 0.5;
    background: rgba(255, 0, 0, 0.6);
  }
}

/* 激光爆炸效果 */
.explosion-laser {
  position: absolute;
  background: linear-gradient(to bottom, transparent, rgba(255, 0, 0, 0.8), transparent);
  z-index: 10;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 0 0 20px rgba(255, 100, 100, 0.5);
  animation: laserPulse 0.2s infinite alternate;
}

@keyframes laserPulse {
  from {
    opacity: 0.7;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 0 0 20px rgba(255, 100, 100, 0.5);
  }
  to {
    opacity: 1;
    box-shadow: 0 0 20px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 100, 100, 0.8);
  }
}
  /* 子弹伤害显示样式 */
  .bullet-damage {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 0, 0, 0.8);
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 3px;
    pointer-events: none;
    z-index: 10;
  }
</style>