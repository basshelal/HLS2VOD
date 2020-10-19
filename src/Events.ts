export class Events {
    private constructor() {}

    public static GetSettings = "GetSettings"
    public static UpdateSettings = "SetSettings"
    public static GetStreams = "GetStreams"
    public static NewStream = "NewStream"
    public static UpdateStream = "UpdateStream"
    public static DeleteStream = "DeleteStream"
    public static ForceRecordStream = "ForceRecordStream"
    public static UnForceRecordStream = "UnForceRecordStream"
    public static PauseStream = "PauseStream"
    public static StartStream = "StartStream"
    public static ViewStreamDir = "ViewStreamDir"
    public static BrowseSchedule = "BrowseSchedule"
}