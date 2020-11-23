import {Context, createContext} from "react"

export const AppName: string = "HLS2VOD"

export type LayoutType = "StreamsLayout" | "EditStreamScheduleLayout"

export interface AppContextType {
    layout: LayoutType

    setLayout(newLayout: LayoutType): void
}

export const defaultAppContext: AppContextType = {
    layout: "StreamsLayout",
    setLayout: (_: LayoutType) => {}
}

export const AppContext: Context<AppContextType> = createContext(defaultAppContext)