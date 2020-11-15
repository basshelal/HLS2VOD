import {defaultAfterAll, defaultBeforeAll} from "../TestUtils"
import {Show} from "../../src/main/models/Show"
import {duration} from "moment"
import moment from "moment/moment"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Show Initialization", async () => {

    const show = new Show({
        name: "My Show", startTimeMoment: moment(new Date()), offsetSeconds: 60, duration: duration()
    })
})

test("Show isActive", async () => {

})

test("Show Update Offset Seconds", async () => {

})

test("Show Serialize", async () => {

})

test("Show fromSerialized", async () => {

})