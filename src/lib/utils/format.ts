export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return new Intl.DateTimeFormat('en-IN', { ...defaultOptions, ...options }).format(date)
}

export function formatDateHumanReadable(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  // Convert to IST
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60))
    return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays)
    return days === 1 ? 'Yesterday' : `${days} days ago`
  } else {
    return istDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    })
  }
}

export function formatDateTimeHumanReadable(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  // Convert to IST
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))

  if (diffInDays < 1) {
    // Today - show time only
    return istDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
  } else if (diffInDays < 7) {
    // This week - show day and time
    const dayName = istDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      timeZone: 'Asia/Kolkata'
    })
    const time = istDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
    return `${dayName} ${time}`
  } else {
    // Older - show date and time
    const dateStr = istDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata'
    })
    const time = istDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
    return `${dateStr} ${time}`
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'refunded':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
