type LogFields = Record<string, unknown>;

function write(level: "info" | "warn" | "error", event: string, fields: LogFields) {
    const record = JSON.stringify({
        ...fields,
        level,
        event,
        timestamp: new Date().toISOString(),
    });

    if (level === "error") {
        console.error(record);
    } else if (level === "warn") {
        console.warn(record);
    } else {
        console.info(record);
    }
}

export const logger = {
    info(event: string, fields: LogFields = {}) {
        write("info", event, fields);
    },
    warn(event: string, fields: LogFields = {}) {
        write("warn", event, fields);
    },
    error(event: string, fields: LogFields = {}) {
        write("error", event, fields);
    },
};
