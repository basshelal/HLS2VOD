/** The {@link serialize} method is used for IPC and Database to transfer and write objects */
export interface Serializable<S> {

    serialize(): S | PromiseLike<S>
}