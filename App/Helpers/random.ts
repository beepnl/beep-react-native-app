export function generateKey(length: number) {
  const chars = "abcdef0123456789"

  const randomArray = Array.from(
    { length },
    (v, k) => chars[Math.floor(Math.random() * chars.length)]
  )
  
  return randomArray.join("")
}
