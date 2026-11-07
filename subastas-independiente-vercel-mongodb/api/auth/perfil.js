const {getDb}=require('../../lib/db');
const {requireUser,publicUser}=require('../../lib/auth');
const {method,error,text}=require('../../lib/http');
module.exports=async(req,res)=>{
 if(!method(req,res,['PATCH']))return;
 try{const db=await getDb();const user=await requireUser(req,res,db);if(!user)return;const direccion=text(req.body?.direccion);if(direccion.length>250)return res.status(400).json({error:'La dirección no puede superar los 250 caracteres.'});await db.collection('usuarios').updateOne({_id:user._id},{$set:{direccion}});const actualizado=await db.collection('usuarios').findOne({_id:user._id});res.json({mensaje:'Perfil actualizado.',usuario:publicUser(actualizado)});}catch(e){error(res,e);}
};
