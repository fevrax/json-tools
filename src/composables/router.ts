import type { RouteLocationRaw, Router } from 'vue-router'

export function useNavigation(router: Router) {
  const navigateTo = (to: RouteLocationRaw) => {
    return router.push(to)
  }

  const navigateReplace = (to: RouteLocationRaw) => {
    return router.replace(to)
  }

  const goBack = () => {
    router.back()
  }

  const goForward = () => {
    router.forward()
  }

  const goHome = () => {
    return router.push('/')
  }

  return {
    navigateTo,
    navigateReplace,
    goBack,
    goForward,
    goHome
  }
}
