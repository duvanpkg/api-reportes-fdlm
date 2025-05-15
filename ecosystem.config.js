require("dotenv").config();

module.exports = [
  {
    name: "API_REPORTES",
    script: "C:/jasper-reports-api/src/index.js",
    autorestart: true,
    watch: true,
    out_file: "L:/api_logs/out.log",
    error_file: "L:/api_logs/err.log",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      USER_MS_SQL: process.env.USER_MS_SQL,
      PASSWORD_MS_SQL: process.env.PASSWORD_MS_SQL,
      SERVER_MS_SQL: process.env.SERVER_MS_SQL,
      PORT_MS_SQL: process.env.PORT_MS_SQL,
      DATABASE_MS_SQL: process.env.DATABASE_MS_SQL,
      USER_DB_API: process.env.USER_DB_API,
      PASSWORD_DB_API: process.env.PASSWORD_DB_API,
      SERVER_DB_API: process.env.SERVER_DB_API,
      PORT_DB_API: process.env.PORT_DB_API,
      DATABASE_DB_API: process.env.DATABASE_DB_API,
      JASPERSTARTER: process.env.JASPERSTARTER,
      JASPER_OUTPUT: process.env.JASPER_OUTPUT,
      JASPER_DB_TYPE: process.env.JASPER_DB_TYPE,
      JASPER_FILE_TYPE: process.env.JASPER_FILE_TYPE,
      JASPER_REPORT_PATH: process.env.JASPER_REPORT_PATH,
      JDBC_DRIVER: process.env.JDBC_DRIVER,
      JDBC_URL: process.env.JDBC_URL,
    },
  },
];
