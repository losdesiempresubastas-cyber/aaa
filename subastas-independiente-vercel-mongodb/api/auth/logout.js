const {clearSession}=require('../../lib/auth');
const {method}=require('../../lib/http');
module.exports=(req,res)=>{if(!method(req,res,['POST']))return;clearSession(res);res.json({mensaje:'Sesión cerrada.'});};
