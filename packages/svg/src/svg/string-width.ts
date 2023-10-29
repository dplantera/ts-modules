export function stringWidth(str: string, fontSize: number) {
    const avgCharWidth = 0.5279276315789471
    return Array.from(str).reduce(
        (acc, cur) => acc + avgCharWidth, 0
    ) * fontSize
}