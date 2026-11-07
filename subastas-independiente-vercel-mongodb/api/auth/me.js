const {getDb}=require('../../lib/db');
const {requireUser,publicUser}=require('../../lib/auth');
const {method,error}=require('../../lib/http');
module.exports=async(req,res)=>{
 if(!method(req,res,['GET']))return;
 try{const db=await getDb();const user=await requireUser(req,res,db);if(!user)return;res.json({usuario:publicUser(user)});}catch(e){error(res,e);}
};
