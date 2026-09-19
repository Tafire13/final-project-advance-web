import { createPool } from 'mysql2/promise';

const pass = "AVNS_1c4D8MrawSBWx8W5cfF";

export const conn = createPool({
    connectionLimit: 10,
    host: 'mysql-web-final-project-watcharakoon2535-fa27.c.aivencloud.com',
    port: 10051,
    user: 'avnadmin',
    password: `${pass}`,
    database: 'lunch_delivery'
});