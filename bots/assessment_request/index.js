'use strict';
const oracleLoader = require('leo-connector-oracle');
const leo = require('leo-sdk');
const ls = leo.streams;

exports.handler = require("leo-sdk/wrappers/cron.js")((event, context, callback) => {

    const settings = Object.assign({
        source: "SchemaChanges"
    }, event);
    return oracleLoader.domainObjectLoader(context.botId, {
        host: "192.168.52.21",
        port: 1521,
        database: "lane2.wgu.edu",
        user: 'WGULEOPOC',
        password: "LeoPoc4Salesforce"
    }, {
        assesments: true
    }, function(ids, builder) {
        const sql = `select ar.assmnt_request_id assessmentpamsid, 
               ainf.wguainf_pidm pidm, 
               rs.ASSMNT_REQUEST_STATUS_DESC operation, 
               nvl(st.pre_assessment, 0) ispreassessment, 
               (select count(*) + 1 
               from saturn.sortest so 
               where so.sortest_pidm = ainf.wguainf_pidm 
                 and so.sortest_tesc_code = asmt.banner_code 
                 and so.sortest_tadm_code in ('FD', 'NS', 'PA')) as attempts, 
               ar.assmnt_code as assessment, 
               (SELECT code FROM WGUPROGRAMS.ASSESSMENT_TYPE WHERE ID = st.assessment_type_id) type,
               ar.ROWID id 
             from wguaap.tbl_assessment_request_log ar 
               inner join wguaap.tbl_assessment_request_status rs on rs.assmnt_request_status = ar.assmnt_request_status 
               inner join wguprograms.assessment asmt on ar.assmnt_code = asmt.banner_code 
               inner join wguprograms.assessment_sub_type st on st.id = asmt.assessment_sub_type_id 
               inner join wguainf ainf on ar.students_wguainf_id = wguainf_id
             where ar.ROWID IN (${ids.filter(i => i).map(i => "'" + i + "'").join()})`;
        console.log("Querying:", sql);
        return builder("id", sql);
    }, {
        inQueue: settings.source,
        outQueue: settings.destination,
        limit: 1000,
        transform: ls.through((obj, done) => {
            obj.payload = {
                assesments: obj.payload.fields.map(e => e.value)
            };
            done(null, obj);
        }
        )
    }, (err) => {
        console.log("all done");
        console.log(err);
        callback(err);
    });
});
