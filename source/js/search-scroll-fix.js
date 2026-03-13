// 搜索结果跳转到匹配内容位置
window.addEventListener('load', () => {
  const params = new URL(location.href).searchParams.get('highlight')
  if (!params) return

  setTimeout(() => {
    const firstHighlight = document.querySelector('.search-keyword')
    if (firstHighlight) {
      const offset = 100
      const elementPosition = firstHighlight.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }, 500)
})
