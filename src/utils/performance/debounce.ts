// 防抖函数
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function(this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(fn: T, limit = 300) {
  let inThrottle: boolean
  let lastFn: ReturnType<typeof setTimeout> | null
  let lastTime: number
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (!inThrottle) {
      fn.apply(this, args)
      lastTime = now
      inThrottle = true
    } else {
      if (lastFn) clearTimeout(lastFn)
      lastFn = setTimeout(() => {
        if (now - lastTime >= limit) {
          fn.apply(this, args)
          lastTime = now
        }
      }, limit - (now - lastTime))
    }
  }
} 