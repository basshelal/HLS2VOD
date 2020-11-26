import {unitOfTime} from "moment"

export type TimeOut = NodeJS.Timeout
export type WritableStream = NodeJS.WritableStream
export type ReadableStream = NodeJS.ReadableStream

export type Day = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
export type TimeUnit = unitOfTime.Base
export type HMTime = { h: number, m: number }
export type SDuration = { amount: number, unit: TimeUnit }