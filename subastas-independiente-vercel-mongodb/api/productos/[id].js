const {getDb}=require('../../lib/db');
const {requireUser}=require('../../lib/auth');
const {ObjectId}=require('mongodb');
const {method,error}=require('../../lib/http');
module.exports=async(req,res)=>{if(!method(req,res,['DELETE']))return;try{const db=await getDb();const user=await requireUser(req,res,db);if(!user)return;const id=req.query.id;if(!ObjectId.isValid(id))return res.status(400).json({error:'Artículo inválido.'});const productId=new ObjectId(id);const r=await db.collection('productos').updateOne({_id:productId,usuarioId:user._id},{$set:{estado:'eliminado',eliminadoEn:new Date()}});if(!r.matchedCount)return res.status(404).json({error:'No se encontró un artículo tuyo para eliminar.'});await Promise.all([db.collection('carrito').deleteMany({productoId:productId}),db.collection('favoritos').deleteMany({productoId})]);res.json({mensaje:'Artículo eliminado.'});}catch(e){error(res,e);}};
