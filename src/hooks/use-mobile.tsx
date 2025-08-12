import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useConnectionSpeed() {
  const [connectionType, setConnectionType] = React.useState<string>('unknown')
  const [isSlowConnection, setIsSlowConnection] = React.useState(false)

  React.useEffect(() => {
    const connection = (navigator as any).connection
    if (connection) {
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || 'unknown')
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 1.5
        )
      }
      
      updateConnection()
      connection.addEventListener('change', updateConnection)
      
      return () => connection.removeEventListener('change', updateConnection)
    }
  }, [])

  return { connectionType, isSlowConnection }
}
