const {getDb}=require('../../../lib/db');
const {requireUser}=require('../../../lib/auth');
const {ObjectId}=require('mongodb');
const {method,error}=require('../../../lib/http');
module.exports=async(req,res)=>{if(!method(req,res,['POST','DELETE']))return;try{const db=await getDb();const user=await requireUser(req,res,db);if(!user)return;const id=req.query.id;if(!ObjectId.isValid(id))return res.status(400).json({error:'Artículo inválido.'});const productoId=new ObjectId(id);if(req.method==='POST'){const p=await db.collection('productos').findOne({_id:productoId,estado:'activo'});if(!p)return res.status(404).json({error:'Artículo no encontrado.'});await db.collection('favoritos').updateOne({usuarioId:user._id,productoId},{$setOnInsert:{creadoEn:new Date()}},{upsert:true});return res.json({mensaje:'Agregado a favoritos.'});}await db.collection('favoritos').deleteOne({usuarioId:user._id,productoId});return res.json({mensaje:'Quitado de favoritos.'});}catch(e){error(res,e);}};
