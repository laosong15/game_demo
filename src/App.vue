<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
let menuMusic = null

// 初始化背景音乐
const initMenuMusic = () => {
  if (!menuMusic) {
    menuMusic = new Audio('/music/《8-Bit Galactic Fighter Battle》.mp3')
    menuMusic.volume = 0.3 // 设置音量为30%
    menuMusic.loop = true // 设置循环播放
  }
}

// 处理用户交互，尝试播放背景音乐
const handleUserInteraction = () => {
  if (menuMusic && menuMusic.paused) {
    menuMusic.play().then(() => {
      // 播放成功后移除事件监听器
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
    }).catch(error => {
      console.log('用户交互后播放音乐失败:', error)
    })
  }
}

// 播放背景音乐
const playMenuMusic = () => {
  if (menuMusic) {
    // 立即尝试播放，不检查paused状态
    menuMusic.play().catch(error => {
      console.log('自动播放背景音乐失败，等待用户交互:', error)
    })
  }
}

// 暂停背景音乐
const pauseMenuMusic = () => {
  if (menuMusic) {
    // 确保无论当前状态如何都尝试暂停
    menuMusic.pause()
    // 重置播放位置以确保不会有残留声音
    menuMusic.currentTime = 0
  }
}

// 路由守卫 - 控制背景音乐播放
router.beforeEach((to, from, next) => {
  // 初始化音乐（如果还没初始化）
  initMenuMusic()
  
  // 检查是否需要播放或暂停背景音乐
  const isGamePage = to.name === 'game'
  
  if (isGamePage) {
    // 如果跳转到游戏页面，立即暂停背景音乐
    pauseMenuMusic()
    // 移除用户交互事件监听器，防止在游戏页面触发主页面音乐
    window.removeEventListener('click', handleUserInteraction)
    window.removeEventListener('keydown', handleUserInteraction)
  } else {
    // 如果跳转到非游戏页面（主页、选择战机、排行榜），播放背景音乐
    playMenuMusic()
    // 重新添加用户交互事件监听器
    window.addEventListener('click', handleUserInteraction)
    window.addEventListener('keydown', handleUserInteraction)
  }
  
  next()
})

onMounted(() => {
  // 组件挂载时立即初始化并尝试播放背景音乐，确保一进入页面就播放
  initMenuMusic()
  playMenuMusic()
  
  // 添加用户交互事件监听器，确保用户交互后播放音乐（绕过浏览器自动播放限制）
  window.addEventListener('click', handleUserInteraction)
  window.addEventListener('keydown', handleUserInteraction)
})

onUnmounted(() => {
  // 组件卸载时清理音乐资源
  if (menuMusic) {
    menuMusic.pause()
    menuMusic = null
  }
  
  // 清理事件监听器
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
})
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
