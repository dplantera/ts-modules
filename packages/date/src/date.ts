

export const TZ = {
    berlin: "Europe/Berlin",
    utc: "UTC"
} as const

export type TZ = typeof TZ[keyof typeof TZ];

export const Locals = {
    de: () => new Intl.Locale("DE"),
    en: () => new Intl.Locale("en-Us")
}

/**
 * See {@link Date}
 */
export type DateIn = Date | string | number;


