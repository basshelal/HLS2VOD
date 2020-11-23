import {Context, createContext} from "react"

export const AppName: string = "HLS2VOD"

export type LayoutType = "StreamsLayout" | "EditStreamScheduleLayout"

export interface SomeAppContextType {
    layout?: LayoutType

    setLayout?(newLayout: LayoutType): void
}

export interface AppContextType extends SomeAppContextType {
    layout: LayoutType

    setLayout(newLayout: LayoutType): void
}

export const defaultAppContext: AppContextType = {
    layout: "StreamsLayout",
    setLayout: (_: LayoutType) => {}
}

export const AppContext: Context<AppContextType> = createContext(defaultAppContext)