'use strict';
module.exports = {
    linkedStacks: [
        "LeoBus"
    ],
    publish: [
        {
            leoaws: {
                profile: "wgu_test",
                region: "us-west-2"
            },
            public: false
        }
    ],
    deploy: {
        dev: {
            stack: "Salesforce",
            parameters: {
                LeoBus: "LeoPlatformSbx-Bus-18S3YETXNITFW"
            }
        }
    },
    test: {
        personas: {
            default: {
                identity: {
                    sourceIp: "127.0.0.1"
                }
            }
        },
        defaultPersona: "default"
    }
};