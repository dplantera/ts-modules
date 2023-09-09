

export const TZ = {
    berlin: "Europe/Berlin",
    utc: "UTC"
} as const

export type TZ = typeof TZ[keyof typeof TZ];

export const Local = {
    "de": "de", 'en': "en-US"
} as const;
export type Local = typeof Local[keyof typeof Local]

export const Locals = {
    de: () => new Intl.Locale("DE"),
    en: () => new Intl.Locale("en-Us")
}

/**
 * See {@link Date}
 */
export type DateIn = Date | string | number;


