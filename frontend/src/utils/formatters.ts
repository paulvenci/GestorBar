export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

export const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(date))
}

export const formatDateTime = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

export const formatNumber = (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num)
}
