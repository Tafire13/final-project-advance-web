import { createPool } from 'mysql2/promise';

export const conn = createPool({
    connectionLimit: 10,
    host: 'mysql-web-final-project-watcharakoon2535-fa27.c.aivencloud.com',
    port: 10051,
    user: 'avnadmin',
    password: '[รหัสผ่าน]',
    database: 'lunch_delivery'
});