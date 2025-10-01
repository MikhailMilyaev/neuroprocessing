require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })
const sequelize = require('../db')
require('../models/models')
sequelize.sync({ force: true }).then(() => { console.log('synced'); process.exit(0) }).catch(e => { console.error(e); process.exit(1) })
