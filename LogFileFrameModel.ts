static parse(rawData: any) {
    let data, frame
    // Ensure rawData is a valid buffer and has minimum required length
    if (!rawData || !Buffer.isBuffer(rawData) || rawData.length < 2) {
        return null;
    }
    try {
        frame = rawData.readInt16BE(0)
        if (rawData.length > 2) {
            data = rawData.subarray(2)
            return new LogFileFrameModel({ frame, data })
        }
        return new LogFileFrameModel({ frame, data: Buffer.alloc(0) })
    } catch (error) {
        console.error('Error parsing log file frame:', error);
        return null;
    }
}
