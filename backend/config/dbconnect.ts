import { createPool } from 'mysql2/promise';

export const conn = createPool({
    connectionLimit: 10,
    host: 'mysql-web-final-project-watcharakoon2535-fa27.c.aivencloud.com',
    port: 10051,
    user: 'avnadmin',
    password: 'AVNS_1c4D8MrawSBWx8W5cfF',
    database: 'lunch_delivery'
});