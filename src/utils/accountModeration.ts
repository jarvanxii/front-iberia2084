const BLOCKED_USERS_KEY = 'iberia2084.blockedUserIds'

function parseBlockedIds() {
  try {
    const values = JSON.parse(localStorage.getItem(BLOCKED_USERS_KEY) ?? '[]') as unknown
    if (!Array.isArray(values)) return []
    return values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
  } catch {
    return []
  }
}

function saveBlockedIds(userIds: number[]) {
  const uniqueIds = [...new Set(userIds)].sort((a, b) => a - b)
  localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(uniqueIds))
  window.dispatchEvent(new CustomEvent('iberia2084:blocked-users-changed'))
}

export function blockedUserIds() {
  return parseBlockedIds()
}

export function isUserBlocked(userId: number) {
  return parseBlockedIds().includes(userId)
}

export function blockUser(userId: number) {
  saveBlockedIds([...parseBlockedIds(), userId])
}

export function unblockUser(userId: number) {
  saveBlockedIds(parseBlockedIds().filter((id) => id !== userId))
}
